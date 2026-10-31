import type { PrismaClient } from '../src/prisma/client.js';
import { facetGroups } from './seed-data/facets.js';
import { categorySeeds } from './seed-data/categories.js';
import { slugify } from '../src/common/slug/transliterate.js';

/** Ключ вида "type:tanks" -> id значения фасета. */
export type FacetIndex = Map<string, string>;

export async function seedFacets(prisma: PrismaClient): Promise<FacetIndex> {
  const index: FacetIndex = new Map();

  for (const [groupOrder, group] of facetGroups.entries()) {
    const saved = await prisma.facetGroup.upsert({
      where: { key: group.key },
      update: {
        title: group.title,
        singleSelect: group.singleSelect,
        sortOrder: groupOrder,
      },
      create: {
        key: group.key,
        title: group.title,
        singleSelect: group.singleSelect,
        sortOrder: groupOrder,
      },
    });

    for (const [valueOrder, value] of group.values.entries()) {
      const savedValue = await prisma.facetValue.upsert({
        where: { groupId_value: { groupId: saved.id, value: value.value } },
        update: { label: value.label, sortOrder: valueOrder },
        create: {
          groupId: saved.id,
          value: value.value,
          label: value.label,
          sortOrder: valueOrder,
        },
      });
      index.set(`${group.key}:${value.value}`, savedValue.id);
    }
  }

  console.log(
    `  фасеты: ${facetGroups.length} групп, ${index.size} значений`,
  );
  return index;
}

export async function seedCategories(
  prisma: PrismaClient,
  facets: FacetIndex,
): Promise<void> {
  let productCount = 0;

  for (const [order, seed] of categorySeeds.entries()) {
    const category = await prisma.category.upsert({
      where: { slug: seed.slug },
      update: {
        title: seed.title,
        short: seed.short,
        description: seed.description,
        positionCount: seed.positionCount,
        highlights: seed.highlights,
        sortOrder: order,
      },
      create: {
        slug: seed.slug,
        title: seed.title,
        short: seed.short,
        description: seed.description,
        positionCount: seed.positionCount,
        highlights: seed.highlights,
        sortOrder: order,
        // Схема по умолчанию ставит DRAFT (правильно для создаваемого
        // админом), поэтому сид обязан указать статус явно.
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    // Связи фасетов пересобираем целиком: проще и идемпотентно.
    await prisma.categoryFacetValue.deleteMany({
      where: { categoryId: category.id },
    });

    const facetValueIds: string[] = [];
    for (const [groupKey, values] of Object.entries(seed.facets)) {
      for (const value of values) {
        const id = facets.get(`${groupKey}:${value}`);
        if (!id) {
          throw new Error(
            `Нет значения фасета ${groupKey}:${value} (категория ${seed.slug})`,
          );
        }
        facetValueIds.push(id);
      }
    }

    await prisma.categoryFacetValue.createMany({
      data: facetValueIds.map((facetValueId) => ({
        categoryId: category.id,
        facetValueId,
      })),
      skipDuplicates: true,
    });

    // items — типовые позиции. Становятся товарами с одним названием:
    // описания, характеристики и фото наполняет админ через API.
    // Слаг — из названия, как это делает ProductsService; в одной
    // категории одинаковых названий нет, но страхуемся суффиксом.
    const usedSlugs = new Set<string>();
    for (const [itemOrder, title] of seed.items.entries()) {
      const root = slugify(title) || 'item';
      let slug = root;
      for (let n = 2; usedSlugs.has(slug); n += 1) slug = `${root}-${n}`;
      usedSlugs.add(slug);

      const existing = await prisma.product.findFirst({
        where: { categoryId: category.id, title },
        select: { id: true },
      });
      if (existing) continue;

      await prisma.product.create({
        data: {
          categoryId: category.id,
          title,
          slug,
          sortOrder: itemOrder,
          status: 'PUBLISHED',
          priceOnRequest: true,
        },
      });
      productCount += 1;
    }
  }

  console.log(
    `  каталог: ${categorySeeds.length} категорий, ${productCount} новых товаров`,
  );
}
