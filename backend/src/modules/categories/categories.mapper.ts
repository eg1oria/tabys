import type { PublishStatus } from '../../prisma/client.js';

type FacetRow = {
  facetValue: { value: string; group: { key: string } };
};

type ImageRow = {
  storageKey: string;
  alt: string;
  width: number | null;
  height: number | null;
  blurDataUrl: string | null;
} | null;

export type PublicCategoryRow = {
  slug: string;
  title: string;
  short: string;
  description: string;
  highlights: string[];
  positionCount: number | null;
  seoTitle: string | null;
  seoDescription: string | null;
  image: ImageRow;
  facetValues: FacetRow[];
  products: { title: string }[];
  _count: { products: number };
};

/**
 * Форма ответа повторяет тип PublicCategory на фронтенде. Фасеты лежат
 * во вложенном facets, а не в корне: ключи групп задаёт редактор, и группа
 * с ключом вида title или count затирала бы одноимённое поле категории.
 *
 * count — именно positionCount ?? фактическое число товаров: витринные числа
 * у трёх категорий расходятся с реальным списком (у торцевых уплотнений
 * 20 против 5), и вычисляемое значение молча поменяло бы цифры на сайте.
 */
export function toPublicCategory(row: PublicCategoryRow, mediaBaseUrl: string) {
  const facets: Record<string, string[]> = {};
  for (const { facetValue } of row.facetValues) {
    (facets[facetValue.group.key] ??= []).push(facetValue.value);
  }

  return {
    slug: row.slug,
    title: row.title,
    short: row.short,
    description: row.description,
    count: row.positionCount ?? row._count.products,
    image: row.image
      ? {
          url: `${mediaBaseUrl}/uploads/${row.image.storageKey}`,
          alt: row.image.alt,
          width: row.image.width,
          height: row.image.height,
          blurDataUrl: row.image.blurDataUrl,
        }
      : null,
    highlights: row.highlights,
    items: row.products.map((p) => p.title),
    facets,
    // Для <title> и description страницы категории; пусто — берутся
    // название и описание.
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
  };
}

export type AdminCategoryRow = PublicCategoryRow & {
  id: string;
  status: PublishStatus;
  sortOrder: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
