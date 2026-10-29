import { Injectable, NotFoundException } from '@nestjs/common';
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
    select: { storageKey: true, alt: true, width: true, height: true, blurDataUrl: true },
  },
  category: { select: { slug: true, title: true } },
  facetValues: {
    select: { facetValue: { select: { value: true, group: { select: { key: true } } } } },
  },
} satisfies Prisma.ProductSelect;

const ADMIN_SELECT = {
  ...PUBLIC_SELECT,
  id: true,
  categoryId: true,
  status: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProductSelect;

const SORTABLE = ['title', 'sortOrder', 'priceFrom', 'createdAt', 'updatedAt'] as const;

type PublicRow = Prisma.ProductGetPayload<{ select: typeof PUBLIC_SELECT }>;

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly audit: AuditService,
  ) {}

  private toPublic(row: PublicRow) {
    const facets: Record<string, string[]> = {};
    for (const { facetValue } of row.facetValues) {
      (facets[facetValue.group.key] ??= []).push(facetValue.value);
    }

    return {
      slug: row.slug,
      title: row.title,
      description: row.description,
      specs: row.specs,
      // Decimal не сериализуется в JSON сам — отдаём строку, чтобы не терять точность.
      priceFrom: row.priceFrom?.toString() ?? null,
      priceOnRequest: row.priceOnRequest,
      category: row.category,
      image: row.image
        ? {
            url: `${this.config.publicUrl}/uploads/${row.image.storageKey}`,
            alt: row.image.alt,
            width: row.image.width,
            height: row.image.height,
            blurDataUrl: row.image.blurDataUrl,
          }
        : null,
      ...facets,
    };
  }

  /**
   * Фасеты: И между группами, ИЛИ внутри группы — так ведёт себя
   * matchesFilters в каталоге на фронтенде.
   */
  private async facetFilter(values: string[]): Promise<Prisma.ProductWhereInput[]> {
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
      ...(dto.category ? { category: { slug: dto.category, status: PublishStatus.PUBLISHED } } : {}),
      ...(dto.q ? { title: { contains: dto.q, mode: 'insensitive' } } : {}),
      AND: await this.facetFilter(dto.facets ?? []),
    };

    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: buildOrderBy(dto.sortBy, dto.order, SORTABLE, { sortOrder: 'asc' }),
        skip: dto.skip,
        take: dto.perPage,
        select: PUBLIC_SELECT,
      }),
      this.prisma.product.count({ where }),
    ]);

    return paginate(rows.map((r) => this.toPublic(r)), total, dto);
  }

  async findAllAdmin(dto: QueryProductsDto): Promise<Paginated<unknown>> {
    const where: Prisma.ProductWhereInput = {
      ...(dto.status ? { status: dto.status } : {}),
      ...(dto.category ? { category: { slug: dto.category } } : {}),
      ...(dto.q ? { title: { contains: dto.q, mode: 'insensitive' } } : {}),
      AND: await this.facetFilter(dto.facets ?? []),
    };

    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: buildOrderBy(dto.sortBy, dto.order, SORTABLE, { sortOrder: 'asc' }),
        skip: dto.skip,
        take: dto.perPage,
        select: ADMIN_SELECT,
      }),
      this.prisma.product.count({ where }),
    ]);

    return paginate(rows, total, dto);
  }

  async findOneAdmin(id: string) {
    const row = await this.prisma.product.findUnique({ where: { id }, select: ADMIN_SELECT });
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
    const last = await this.prisma.product.findFirst({
      where: { categoryId: dto.categoryId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const created = await this.prisma.product.create({
      data: {
        categoryId: dto.categoryId,
        title: dto.title,
        slug,
        description: dto.description,
        specs: dto.specs,
        priceFrom: dto.priceFrom ?? null,
        priceOnRequest: dto.priceOnRequest ?? dto.priceFrom === undefined,
        imageId: dto.imageId ?? null,
        sortOrder: dto.sortOrder ?? (last?.sortOrder ?? -1) + 1,
        facetValues: dto.facetValueIds?.length
          ? { create: dto.facetValueIds.map((facetValueId) => ({ facetValueId })) }
          : undefined,
      },
      select: ADMIN_SELECT,
    });

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
    const { facetValueIds, ...rest } = dto;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (facetValueIds) {
        await tx.productFacetValue.deleteMany({ where: { productId: id } });
        if (facetValueIds.length > 0) {
          await tx.productFacetValue.createMany({
            data: facetValueIds.map((facetValueId) => ({ productId: id, facetValueId })),
            skipDuplicates: true,
          });
        }
      }
      return tx.product.update({ where: { id }, data: rest, select: ADMIN_SELECT });
    });

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
    const updated = await this.prisma.product.update({
      where: { id },
      data: { status },
      select: ADMIN_SELECT,
    });
    await this.audit.log({
      actor,
      action: status === PublishStatus.PUBLISHED ? 'product.publish' : 'product.unpublish',
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

  private freeSlug(categoryId: string, title: string): Promise<string> {
    return uniqueSlug(title, async (candidate) => {
      const found = await this.prisma.product.findFirst({
        where: { categoryId, slug: candidate },
        select: { id: true },
      });
      return found !== null;
    });
  }
}
