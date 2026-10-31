import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AppConfigService } from '../../config/app-config.service.js';
import { AuditService } from '../../common/audit/audit.service.js';
import { buildOrderBy } from '../../common/prisma/order-by.js';
import { paginate, type Paginated } from '../../common/dto/pagination.dto.js';
import { uniqueSlug } from '../../common/slug/transliterate.js';
import { toPublicCategory } from './categories.mapper.js';
import { PublishStatus, type Prisma } from '../../prisma/client.js';
import type { AuthUser } from '../../auth/types.js';
import type { CreateCategoryDto } from './dto/create-category.dto.js';
import type { UpdateCategoryDto } from './dto/update-category.dto.js';
import type { QueryCategoriesDto } from './dto/query-categories.dto.js';
import type { ReorderItemDto } from './dto/reorder.dto.js';

const IMAGE_SELECT = {
  storageKey: true,
  alt: true,
  width: true,
  height: true,
  blurDataUrl: true,
} as const;

const FACET_SELECT = {
  select: { facetValue: { select: { value: true, group: { select: { key: true } } } } },
} as const;

/**
 * Явный select, а не фильтрация готовой строки: поле, которое не выбрали
 * из базы, утечь наружу не может. Ошибка в такой схеме даёт отсутствующее
 * поле, а не лишнее.
 */
const PUBLIC_SELECT = {
  slug: true,
  title: true,
  short: true,
  description: true,
  highlights: true,
  positionCount: true,
  seoTitle: true,
  seoDescription: true,
  image: { select: IMAGE_SELECT },
  facetValues: FACET_SELECT,
  products: {
    where: { status: PublishStatus.PUBLISHED },
    orderBy: { sortOrder: 'asc' },
    select: { title: true },
  },
  _count: { select: { products: { where: { status: PublishStatus.PUBLISHED } } } },
} satisfies Prisma.CategorySelect;

/**
 * Админский select шире публичного: форме правки нужны ровно те поля,
 * которые она потом отправляет обратно. imageId и facetValueId в
 * PUBLIC_SELECT не добавляем — наружу идентификаторы не нужны.
 */
const ADMIN_SELECT = {
  ...PUBLIC_SELECT,
  id: true,
  imageId: true,
  facetValues: {
    select: {
      facetValueId: true,
      facetValue: { select: { value: true, group: { select: { key: true } } } },
    },
  },
  status: true,
  sortOrder: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CategorySelect;

const SORTABLE = ['title', 'sortOrder', 'createdAt', 'updatedAt'] as const;

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly audit: AuditService,
  ) {}

  // ───────────────────────── публичное ─────────────────────────

  async findAllPublic() {
    const rows = await this.prisma.category.findMany({
      where: { status: PublishStatus.PUBLISHED },
      orderBy: { sortOrder: 'asc' },
      select: PUBLIC_SELECT,
    });
    return rows.map((row) => toPublicCategory(row, this.config.publicUrl));
  }

  async findOnePublic(slug: string) {
    const row = await this.prisma.category.findFirst({
      where: { slug, status: PublishStatus.PUBLISHED },
      select: PUBLIC_SELECT,
    });
    if (!row) throw new NotFoundException('Категория не найдена');
    return toPublicCategory(row, this.config.publicUrl);
  }

  // ───────────────────────── админское ─────────────────────────

  async findAllAdmin(dto: QueryCategoriesDto): Promise<Paginated<unknown>> {
    const where: Prisma.CategoryWhereInput = {
      ...(dto.status ? { status: dto.status } : {}),
      ...(dto.q
        ? {
            OR: [
              { title: { contains: dto.q, mode: 'insensitive' } },
              { slug: { contains: dto.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        orderBy: buildOrderBy(dto.sortBy, dto.order, SORTABLE, { sortOrder: 'asc' }),
        skip: dto.skip,
        take: dto.perPage,
        select: ADMIN_SELECT,
      }),
      this.prisma.category.count({ where }),
    ]);

    return paginate(rows, total, dto);
  }

  async findOneAdmin(id: string) {
    const row = await this.prisma.category.findUnique({
      where: { id },
      select: ADMIN_SELECT,
    });
    if (!row) throw new NotFoundException('Категория не найдена');
    return row;
  }

  async create(dto: CreateCategoryDto, actor: AuthUser) {
    const slug = dto.slug ?? (await this.freeSlug(dto.title));
    const last = await this.prisma.category.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const created = await this.prisma.category.create({
      data: {
        slug,
        title: dto.title,
        short: dto.short ?? dto.title,
        description: dto.description,
        highlights: dto.highlights ?? [],
        positionCount: dto.positionCount ?? null,
        imageId: dto.imageId ?? null,
        seoTitle: dto.seoTitle,
        seoDescription: dto.seoDescription,
        sortOrder: (last?.sortOrder ?? -1) + 1,
        facetValues: dto.facetValueIds?.length
          ? { create: dto.facetValueIds.map((facetValueId) => ({ facetValueId })) }
          : undefined,
      },
      select: ADMIN_SELECT,
    });

    await this.audit.log({
      actor,
      action: 'category.create',
      entity: 'Category',
      entityId: created.id,
      after: created,
    });
    return created;
  }

  async update(id: string, dto: UpdateCategoryDto, actor: AuthUser) {
    const before = await this.findOneAdmin(id);
    const { facetValueIds, ...rest } = dto;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (facetValueIds) {
        // Связи пересобираем целиком: PATCH со списком задаёт его целиком.
        await tx.categoryFacetValue.deleteMany({ where: { categoryId: id } });
        if (facetValueIds.length > 0) {
          await tx.categoryFacetValue.createMany({
            data: facetValueIds.map((facetValueId) => ({ categoryId: id, facetValueId })),
            skipDuplicates: true,
          });
        }
      }

      return tx.category.update({
        where: { id },
        data: {
          ...rest,
          ...(rest.highlights ? { highlights: rest.highlights } : {}),
        },
        select: ADMIN_SELECT,
      });
    });

    await this.audit.log({
      actor,
      action: 'category.update',
      entity: 'Category',
      entityId: id,
      before,
      after: updated,
    });
    return updated;
  }

  async setStatus(id: string, status: PublishStatus, actor: AuthUser) {
    const before = await this.findOneAdmin(id);
    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        status,
        publishedAt: status === PublishStatus.PUBLISHED ? new Date() : null,
      },
      select: ADMIN_SELECT,
    });

    await this.audit.log({
      actor,
      action: status === PublishStatus.PUBLISHED ? 'category.publish' : 'category.unpublish',
      entity: 'Category',
      entityId: id,
      before: { status: before.status },
      after: { status },
    });
    return updated;
  }

  async reorder(items: ReorderItemDto[], actor: AuthUser): Promise<void> {
    // Весь список одной транзакцией: при частичном применении каталог
    // остаётся наполовину переставленным.
    await this.prisma.$transaction(
      items.map(({ id, sortOrder }) =>
        this.prisma.category.update({ where: { id }, data: { sortOrder } }),
      ),
    );

    await this.audit.log({
      actor,
      action: 'category.reorder',
      entity: 'Category',
      after: { order: items.map((i) => i.id) },
    });
  }

  async remove(id: string, actor: AuthUser): Promise<void> {
    const before = await this.findOneAdmin(id);
    await this.prisma.category.delete({ where: { id } });
    await this.audit.log({
      actor,
      action: 'category.delete',
      entity: 'Category',
      entityId: id,
      before,
    });
  }

  private freeSlug(title: string): Promise<string> {
    return uniqueSlug(title, async (candidate) => {
      const found = await this.prisma.category.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      return found !== null;
    });
  }
}
