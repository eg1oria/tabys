import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AppConfigService } from '../../config/app-config.service.js';
import { AuditService } from '../../common/audit/audit.service.js';
import { buildOrderBy } from '../../common/prisma/order-by.js';
import { paginate, type Paginated } from '../../common/dto/pagination.dto.js';
import { uniqueSlug } from '../../common/slug/transliterate.js';
import { PublishStatus, type Prisma } from '../../prisma/client.js';
import type { AuthUser } from '../../auth/types.js';
import type { CreateProductDto } from './dto/create-product.dto.js';
import type { UpdateProductDto } from './dto/update-product.dto.js';
import type { QueryProductsDto } from './dto/query-products.dto.js';
import type { ReorderItemDto } from '../categories/dto/reorder.dto.js';

const PUBLIC_SELECT = {
  slug: true,
  title: true,
  description: true,
  specs: true,
  priceFrom: true,
  priceOnRequest: true,
  image: {
    select: {
      storageKey: true,
      alt: true,
      width: true,
      height: true,
      blurDataUrl: true,
    },
  },
  category: { select: { slug: true, title: true } },
  facetValues: {
    select: {
      facetValue: { select: { value: true, group: { select: { key: true } } } },
    },
  },
} satisfies Prisma.ProductSelect;

/**
 * Страница товара: к списочным полям добавляются артикул и галерея.
 * В списке их нет — карточке в сетке хватает главного фото.
 */
const PUBLIC_DETAIL_SELECT = {
  ...PUBLIC_SELECT,
  sku: true,
  images: {
    orderBy: { sortOrder: 'asc' },
    select: {
      media: {
        select: {
          storageKey: true,
          alt: true,
          width: true,
          height: true,
          blurDataUrl: true,
        },
      },
    },
  },
} satisfies Prisma.ProductSelect;

/** Шире публичного: форме правки нужны идентификаторы, а не только значения. */
/**
 * Со связями — поэтому только для чтения. В записи (create/update) им не
 * место: Prisma заворачивает такую запись в транзакцию и тянет связи
 * параллельно по одному соединению pg, а pg@9 это запретит. Пишем с
 * select: { id: true }, затем читаем через findOneAdmin; e2e падает на
 * нарушении (test/setup-e2e.ts).
 */
const ADMIN_SELECT = {
  ...PUBLIC_SELECT,
  id: true,
  categoryId: true,
  sku: true,
  imageId: true,
  images: {
    select: {
      mediaId: true,
      sortOrder: true,
      media: {
        select: {
          storageKey: true,
          alt: true,
          width: true,
          height: true,
          derivatives: true,
        },
      },
    },
    orderBy: { sortOrder: 'asc' },
  },
  facetValues: {
    select: {
      facetValueId: true,
      facetValue: { select: { value: true, group: { select: { key: true } } } },
    },
  },
  status: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProductSelect;

const SORTABLE = [
  'title',
  'sortOrder',
  'priceFrom',
  'createdAt',
  'updatedAt',
] as const;

/** Характеристика товара — как её отдаёт API (см. ProductSpecDto). */
export type ProductSpec = { key: string; value: string };

/**
 * specs в базе — массив пар (миграция product_specs_ordered). Json из Prisma
 * не типизирован, поэтому берём только корректные элементы, а отсутствие
 * характеристик отдаём пустым массивом: сайту не нужно различать null и [].
 */
function toSpecs(value: Prisma.JsonValue | null): ProductSpec[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) return [];
    const { key, value: text } = item;
    return typeof key === 'string' && typeof text === 'string' ? [{ key, value: text }] : [];
  });
}

/** Потолок выгрузки: больше одной CSV-страницы каталог всё равно не бывает. */
const EXPORT_LIMIT = 5000;

/** Экранирование по RFC 4180 плюс защита от формул в Excel. */
function csvCell(value: string): string {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

type PublicRow = Prisma.ProductGetPayload<{ select: typeof PUBLIC_SELECT }>;
type PublicDetailRow = Prisma.ProductGetPayload<{
  select: typeof PUBLIC_DETAIL_SELECT;
}>;
type ImageRow = NonNullable<PublicRow['image']>;

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly audit: AuditService,
  ) {}

  private toPublicImage(image: ImageRow) {
    return {
      url: `${this.config.publicUrl}/uploads/${image.storageKey}`,
      alt: image.alt,
      width: image.width,
      height: image.height,
      blurDataUrl: image.blurDataUrl,
    };
  }

  private toPublic(row: PublicRow) {
    const facets: Record<string, string[]> = {};
    for (const { facetValue } of row.facetValues) {
      (facets[facetValue.group.key] ??= []).push(facetValue.value);
    }

    return {
      slug: row.slug,
      title: row.title,
      description: row.description,
      specs: toSpecs(row.specs),
      // Decimal не сериализуется в JSON сам — отдаём строку, чтобы не терять точность.
      priceFrom: row.priceFrom?.toString() ?? null,
      priceOnRequest: row.priceOnRequest,
      category: row.category,
      image: row.image ? this.toPublicImage(row.image) : null,
      // Вложенным объектом, как и у категорий: ключи групп задаёт редактор.
      facets,
    };
  }

  /**
   * Фасеты: И между группами, ИЛИ внутри группы — так ведёт себя
   * matchesFilters в каталоге на фронтенде.
   */
  private async facetFilter(
    values: string[],
  ): Promise<Prisma.ProductWhereInput[]> {
    if (values.length === 0) return [];

    const rows = await this.prisma.facetValue.findMany({
      where: { value: { in: values } },
      select: { id: true, group: { select: { key: true } } },
    });

    // Ни одно значение не опознано (опечатка в URL, удалённый фильтр) —
    // это пустая выборка, а не отсутствие фильтра: иначе мусор в query
    // молча показывал бы весь каталог как неотфильтрованный.
    if (rows.length === 0) return [{ id: { in: [] } }];

    const byGroup = new Map<string, string[]>();
    for (const row of rows) {
      const list = byGroup.get(row.group.key) ?? [];
      list.push(row.id);
      byGroup.set(row.group.key, list);
    }

    return [...byGroup.values()].map((ids) => ({
      facetValues: { some: { facetValueId: { in: ids } } },
    }));
  }

  async findAllPublic(dto: QueryProductsDto): Promise<Paginated<unknown>> {
    const where: Prisma.ProductWhereInput = {
      status: PublishStatus.PUBLISHED,
      category: { status: PublishStatus.PUBLISHED },
      ...(dto.category
        ? { category: { slug: dto.category, status: PublishStatus.PUBLISHED } }
        : {}),
      ...(dto.q ? { title: { contains: dto.q, mode: 'insensitive' } } : {}),
      AND: await this.facetFilter(dto.facets ?? []),
    };

    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: buildOrderBy(dto.sortBy, dto.order, SORTABLE, {
          sortOrder: 'asc',
        }),
        skip: dto.skip,
        take: dto.perPage,
        select: PUBLIC_SELECT,
      }),
      this.prisma.product.count({ where }),
    ]);

    return paginate(
      rows.map((r) => this.toPublic(r)),
      total,
      dto,
    );
  }

  /**
   * Страница товара. Черновик и товар из снятой с публикации категории
   * отдают 404 — как и в списке, наружу видно только опубликованное.
   */
  async findOnePublic(categorySlug: string, slug: string) {
    const row = await this.prisma.product.findFirst({
      where: {
        slug,
        status: PublishStatus.PUBLISHED,
        category: { slug: categorySlug, status: PublishStatus.PUBLISHED },
      },
      select: PUBLIC_DETAIL_SELECT,
    });
    if (!row) throw new NotFoundException('Товар не найден');
    return this.toPublicDetail(row);
  }

  private toPublicDetail(row: PublicDetailRow) {
    const gallery = row.images.map(({ media }) => this.toPublicImage(media));
    return {
      ...this.toPublic(row),
      sku: row.sku,
      // Галерея пуста у товаров, где задано только главное фото, —
      // тогда страница показывает его одно.
      images:
        gallery.length > 0 ? gallery : row.image ? [this.toPublicImage(row.image)] : [],
    };
  }

  private async adminWhere(
    dto: QueryProductsDto,
  ): Promise<Prisma.ProductWhereInput> {
    return {
      ...(dto.status ? { status: dto.status } : {}),
      ...(dto.category ? { category: { slug: dto.category } } : {}),
      // Редактор ищет и по названию, и по артикулу — одним полем.
      ...(dto.q
        ? {
            OR: [
              { title: { contains: dto.q, mode: 'insensitive' } },
              { sku: { contains: dto.q, mode: 'insensitive' } },
            ],
          }
        : {}),
      AND: await this.facetFilter(dto.facets ?? []),
    };
  }

  async findAllAdmin(dto: QueryProductsDto): Promise<Paginated<unknown>> {
    const where = await this.adminWhere(dto);

    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: buildOrderBy(dto.sortBy, dto.order, SORTABLE, {
          sortOrder: 'asc',
        }),
        skip: dto.skip,
        take: dto.perPage,
        select: ADMIN_SELECT,
      }),
      this.prisma.product.count({ where }),
    ]);

    return paginate(rows, total, dto);
  }

  /**
   * Выгрузка списка в CSV по тем же фильтрам, что и в таблице.
   * Разделитель — точка с запятой: Excel с русской локалью иначе кладёт
   * всю строку в одну ячейку.
   */
  async exportCsv(dto: QueryProductsDto): Promise<string> {
    const rows = await this.prisma.product.findMany({
      where: await this.adminWhere(dto),
      orderBy: buildOrderBy(dto.sortBy, dto.order, SORTABLE, {
        sortOrder: 'asc',
      }),
      take: EXPORT_LIMIT,
      select: {
        sku: true,
        title: true,
        slug: true,
        priceFrom: true,
        priceOnRequest: true,
        status: true,
        category: { select: { title: true } },
      },
    });

    const header = [
      'Артикул',
      'Название',
      'Категория',
      'Цена от',
      'Статус',
      'Адрес',
    ];
    const lines = rows.map((row) => [
      row.sku ?? '',
      row.title,
      row.category.title,
      row.priceOnRequest || row.priceFrom === null
        ? 'по запросу'
        : row.priceFrom.toString(),
      row.status === PublishStatus.PUBLISHED ? 'Опубликован' : 'Черновик',
      row.slug ?? '',
    ]);

    return [header, ...lines]
      .map((cells) => cells.map(csvCell).join(';'))
      .join('\r\n');
  }

  async findOneAdmin(id: string) {
    const row = await this.prisma.product.findUnique({
      where: { id },
      select: ADMIN_SELECT,
    });
    if (!row) throw new NotFoundException('Товар не найден');
    return row;
  }

  async create(dto: CreateProductDto, actor: AuthUser) {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
      select: { id: true },
    });
    if (!category) throw new NotFoundException('Категория не найдена');

    const slug = dto.slug ?? (await this.freeSlug(dto.categoryId, dto.title));
    if (dto.slug) await this.ensureFreeSlug(dto.categoryId, dto.slug);
    const last = await this.prisma.product.findFirst({
      where: { categoryId: dto.categoryId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    await this.ensureFreeSku(dto.sku);
    const gallery = await this.checkedGallery(dto.imageIds);

    const { id } = await this.prisma.product.create({
      data: {
        categoryId: dto.categoryId,
        title: dto.title,
        slug,
        sku: dto.sku ?? null,
        description: dto.description,
        // DTO — экземпляры класса; в Json кладём простые объекты.
        specs: dto.specs?.map(({ key, value }) => ({ key, value })),
        priceFrom: dto.priceFrom ?? null,
        priceOnRequest: dto.priceOnRequest ?? dto.priceFrom === undefined,
        // Главное фото — первое в галерее, иначе переданное отдельно.
        imageId: gallery?.[0] ?? dto.imageId ?? null,
        status: dto.status ?? PublishStatus.PUBLISHED,
        sortOrder: dto.sortOrder ?? (last?.sortOrder ?? -1) + 1,
        facetValues: dto.facetValueIds?.length
          ? {
              create: dto.facetValueIds.map((facetValueId) => ({
                facetValueId,
              })),
            }
          : undefined,
        images: gallery?.length
          ? {
              create: gallery.map((mediaId, sortOrder) => ({
                mediaId,
                sortOrder,
              })),
            }
          : undefined,
      },
      select: { id: true },
    });
    const created = await this.findOneAdmin(id);

    await this.audit.log({
      actor,
      action: 'product.create',
      entity: 'Product',
      entityId: created.id,
      after: created,
    });
    return created;
  }

  async update(id: string, dto: UpdateProductDto, actor: AuthUser) {
    const before = await this.findOneAdmin(id);
    const { facetValueIds, imageIds, slug, specs, ...rest } = dto;

    // Слаг — часть адреса страницы, без него товара на сайте нет.
    // Стёртое в форме поле значит «собрать заново из названия».
    const nextSlug =
      slug === null
        ? await this.freeSlug(
            dto.categoryId ?? before.categoryId,
            dto.title ?? before.title,
            id,
          )
        : slug;

    // Слаг уникален в категории: занятым он может оказаться и при ручной
    // правке, и при переносе товара туда, где такой адрес уже есть.
    const targetCategory = dto.categoryId ?? before.categoryId;
    if (typeof slug === 'string' || targetCategory !== before.categoryId) {
      await this.ensureFreeSlug(targetCategory, nextSlug ?? before.slug, id);
    }
    await this.ensureFreeSku(dto.sku, id);
    const gallery = await this.checkedGallery(imageIds);

    await this.prisma.$transaction(async (tx) => {
      if (facetValueIds) {
        await tx.productFacetValue.deleteMany({ where: { productId: id } });
        if (facetValueIds.length > 0) {
          await tx.productFacetValue.createMany({
            data: facetValueIds.map((facetValueId) => ({
              productId: id,
              facetValueId,
            })),
            skipDuplicates: true,
          });
        }
      }

      if (gallery) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (gallery.length > 0) {
          await tx.productImage.createMany({
            data: gallery.map((mediaId, sortOrder) => ({
              productId: id,
              mediaId,
              sortOrder,
            })),
            skipDuplicates: true,
          });
        }
      }

      await tx.product.update({
        where: { id },
        // Главное фото всегда первое в галерее: иначе карточка на сайте
        // показывала бы картинку, которую редактор уже убрал.
        data: {
          ...rest,
          ...(specs ? { specs: specs.map(({ key, value }) => ({ key, value })) } : {}),
          ...(nextSlug !== undefined ? { slug: nextSlug } : {}),
          ...(gallery ? { imageId: gallery[0] ?? null } : {}),
        },
        select: { id: true },
      });
    });

    // Связи читаем уже после коммита — см. ADMIN_SELECT.
    const updated = await this.findOneAdmin(id);

    await this.audit.log({
      actor,
      action: 'product.update',
      entity: 'Product',
      entityId: id,
      before,
      after: updated,
    });
    return updated;
  }

  async setStatus(id: string, status: PublishStatus, actor: AuthUser) {
    await this.findOneAdmin(id);
    await this.prisma.product.update({
      where: { id },
      data: { status },
      select: { id: true },
    });
    const updated = await this.findOneAdmin(id);
    await this.audit.log({
      actor,
      action:
        status === PublishStatus.PUBLISHED
          ? 'product.publish'
          : 'product.unpublish',
      entity: 'Product',
      entityId: id,
      after: { status },
    });
    return updated;
  }

  async reorder(items: ReorderItemDto[], actor: AuthUser): Promise<void> {
    await this.prisma.$transaction(
      items.map(({ id, sortOrder }) =>
        this.prisma.product.update({ where: { id }, data: { sortOrder } }),
      ),
    );
    await this.audit.log({
      actor,
      action: 'product.reorder',
      entity: 'Product',
      after: { order: items.map((i) => i.id) },
    });
  }

  async remove(id: string, actor: AuthUser): Promise<void> {
    const before = await this.findOneAdmin(id);
    await this.prisma.product.delete({ where: { id } });
    await this.audit.log({
      actor,
      action: 'product.delete',
      entity: 'Product',
      entityId: id,
      before,
    });
  }

  /** Артикул уникален: без проверки Prisma отдала бы невнятный 409. */
  private async ensureFreeSku(
    sku: string | null | undefined,
    selfId?: string,
  ): Promise<void> {
    if (!sku) return;
    const found = await this.prisma.product.findFirst({
      where: { sku, ...(selfId ? { id: { not: selfId } } : {}) },
      select: { title: true },
    });
    if (found)
      throw new ConflictException(`sku: артикул уже у товара «${found.title}»`);
  }

  private async ensureFreeSlug(
    categoryId: string,
    slug: string,
    selfId?: string,
  ): Promise<void> {
    const found = await this.prisma.product.findFirst({
      where: { categoryId, slug, ...(selfId ? { id: { not: selfId } } : {}) },
      select: { title: true },
    });
    if (found) {
      throw new ConflictException(
        `slug: адрес уже занят товаром «${found.title}» в этой категории`,
      );
    }
  }

  /**
   * Галерея: убираем дубли и проверяем, что все картинки существуют.
   * undefined — поле не передали, галерею не трогаем; [] — очистить.
   */
  private async checkedGallery(
    ids: string[] | undefined,
  ): Promise<string[] | undefined> {
    if (!ids) return undefined;
    const unique = [...new Set(ids)];
    if (unique.length === 0) return [];

    const found = await this.prisma.mediaAsset.findMany({
      where: { id: { in: unique } },
      select: { id: true },
    });
    if (found.length !== unique.length) {
      throw new BadRequestException('imageIds: часть картинок не найдена');
    }
    return unique;
  }

  private freeSlug(
    categoryId: string,
    title: string,
    selfId?: string,
  ): Promise<string> {
    return uniqueSlug(title, async (candidate) => {
      const found = await this.prisma.product.findFirst({
        where: {
          categoryId,
          slug: candidate,
          ...(selfId ? { id: { not: selfId } } : {}),
        },
        select: { id: true },
      });
      return found !== null;
    });
  }
}
