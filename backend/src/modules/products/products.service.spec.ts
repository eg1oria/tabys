import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ProductsService } from './products.service.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import type { AppConfigService } from '../../config/app-config.service.js';
import type { AuditService } from '../../common/audit/audit.service.js';
import type { AuthUser } from '../../auth/types.js';
import type { QueryProductsDto } from './dto/query-products.dto.js';

const actor: AuthUser = { id: 'u1', email: 'e@tabys.kz', role: 'EDITOR' };

type Row = {
  id: string;
  title: string;
  categoryId: string;
  slug: string;
  sku: string | null;
};

/**
 * Prisma в памяти ровно настолько, насколько её трогает сервис: товары
 * (для проверок слага и артикула), картинки и связи галереи.
 */
function stub(products: Row[] = [], mediaIds: string[] = []) {
  const where = (w: Record<string, unknown>) => (p: Row) =>
    Object.entries(w).every(([key, value]) => {
      if (
        key === 'id' &&
        value &&
        typeof value === 'object' &&
        'not' in value
      ) {
        return p.id !== (value as { not: string }).not;
      }
      return (p as Record<string, unknown>)[key] === value;
    });

  const saved = new Map<string, object>();
  const prisma = {
    category: { findUnique: vi.fn().mockResolvedValue({ id: 'c1' }) },
    product: {
      findFirst: vi.fn(
        async ({
          where: w,
          orderBy,
        }: {
          where: Record<string, unknown>;
          orderBy?: unknown;
        }) => {
          if (orderBy) return { sortOrder: 4 }; // последний в категории
          return products.find(where(w)) ?? null;
        },
      ),
      findUnique: vi.fn(async ({ where: w }: { where: { id: string } }) => {
        if (saved.has(w.id)) return saved.get(w.id);
        const row = products.find((p) => p.id === w.id);
        return row ? { ...row, images: [], facetValues: [] } : null;
      }),
      // Сервис пишет с select: { id }, а затем перечитывает запись —
      // поэтому записанное запоминаем, как база.
      create: vi.fn(async ({ data }: { data: unknown }) => {
        saved.set('new', { id: 'new', ...(data as object) });
        return { id: 'new' };
      }),
      update: vi.fn(async ({ where: w, data }: { where: { id: string }; data: unknown }) => {
        saved.set(w.id, { ...(saved.get(w.id) ?? { id: w.id }), ...(data as object) });
        return { id: w.id };
      }),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    mediaAsset: {
      findMany: vi.fn(
        async ({ where: w }: { where: { id: { in: string[] } } }) =>
          w.id.in.filter((id) => mediaIds.includes(id)).map((id) => ({ id })),
      ),
    },
    productImage: { deleteMany: vi.fn(), createMany: vi.fn() },
    productFacetValue: { deleteMany: vi.fn(), createMany: vi.fn() },
    facetValue: { findMany: vi.fn().mockResolvedValue([]) },
    $transaction: vi.fn(),
  };
  prisma.$transaction.mockImplementation(
    async (fn: (tx: typeof prisma) => unknown) => fn(prisma),
  );
  return prisma;
}

function service(prisma: ReturnType<typeof stub>) {
  return new ProductsService(
    prisma as unknown as PrismaService,
    { publicUrl: 'https://tabys.kz' } as AppConfigService,
    { log: vi.fn() } as unknown as AuditService,
  );
}

const existing: Row = {
  id: 'p1',
  title: 'Резервуар 500',
  categoryId: 'c1',
  slug: 'rezervuar-500',
  sku: 'TC-R-500',
};
const other: Row = {
  id: 'p2',
  title: 'Танк',
  categoryId: 'c2',
  slug: 'tank',
  sku: null,
};

describe('ProductsService: артикул', () => {
  it('занятый артикул при создании — 409 с названием товара-владельца', async () => {
    const svc = service(stub([existing]));
    await expect(
      svc.create({ categoryId: 'c1', title: 'Другой', sku: 'TC-R-500' }, actor),
    ).rejects.toThrow(/«Резервуар 500»/);
  });

  it('свой же артикул при правке — не конфликт', async () => {
    const prisma = stub([existing]);
    await service(prisma).update(
      'p1',
      { sku: 'TC-R-500', title: 'Новое имя' },
      actor,
    );
    expect(prisma.product.update).toHaveBeenCalled();
  });

  it('чужой артикул при правке — 409, товар не меняется', async () => {
    const prisma = stub([existing, { ...other, sku: 'TK-1' }]);
    await expect(
      service(prisma).update('p1', { sku: 'TK-1' }, actor),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('без артикула база не опрашивается', async () => {
    const prisma = stub();
    await service(prisma).create(
      { categoryId: 'c1', title: 'Без артикула' },
      actor,
    );
    const skuLookups = prisma.product.findFirst.mock.calls.filter(
      ([a]) => 'sku' in a.where,
    );
    expect(skuLookups).toHaveLength(0);
  });
});

describe('ProductsService: слаг', () => {
  it('собирается из названия, занятый получает суффикс', async () => {
    const prisma = stub([existing]);
    await service(prisma).create(
      { categoryId: 'c1', title: 'Резервуар 500' },
      actor,
    );
    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: 'rezervuar-500-2' }),
      }),
    );
  });

  it('тот же слаг в другой категории свободен', async () => {
    const prisma = stub([existing]);
    prisma.category.findUnique.mockResolvedValue({ id: 'c2' });
    await service(prisma).create(
      { categoryId: 'c2', title: 'Резервуар 500' },
      actor,
    );
    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: 'rezervuar-500' }),
      }),
    );
  });

  it('занятый слаг, введённый руками, — 409 с понятным текстом, а не ошибка базы', async () => {
    const svc = service(stub([existing]));
    await expect(
      svc.create(
        { categoryId: 'c1', title: 'X', slug: 'rezervuar-500' },
        actor,
      ),
    ).rejects.toThrow(/slug: адрес уже занят товаром «Резервуар 500»/);
  });

  it('перенос в категорию, где адрес занят, — 409', async () => {
    const prisma = stub([existing, { ...other, slug: 'rezervuar-500' }]);
    await expect(
      service(prisma).update('p1', { categoryId: 'c2' }, actor),
    ).rejects.toThrow(/slug: адрес уже занят/);
  });

  it('стёртый слаг собирается заново, не споря с самим товаром', async () => {
    const prisma = stub([existing]);
    await service(prisma).update('p1', { slug: null }, actor);
    expect(prisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: 'rezervuar-500' }),
      }),
    );
  });

  it('нет категории — 404', async () => {
    const prisma = stub();
    prisma.category.findUnique.mockResolvedValue(null);
    await expect(
      service(prisma).create({ categoryId: 'x', title: 'Т' }, actor),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('ProductsService: галерея', () => {
  it('порядок сохраняется, дубли убираются, первая картинка — главная', async () => {
    const prisma = stub([], ['m1', 'm2', 'm3']);
    await service(prisma).create(
      {
        categoryId: 'c1',
        title: 'Т',
        imageIds: ['m2', 'm1', 'm2', 'm3'],
        imageId: 'm3',
      },
      actor,
    );
    const { data } = prisma.product.create.mock.calls[0][0] as {
      data: {
        imageId: string;
        images: { create: unknown[] };
        sortOrder: number;
      };
    };
    expect(data.imageId).toBe('m2');
    expect(data.images.create).toEqual([
      { mediaId: 'm2', sortOrder: 0 },
      { mediaId: 'm1', sortOrder: 1 },
      { mediaId: 'm3', sortOrder: 2 },
    ]);
    // Новый товар встаёт в конец категории.
    expect(data.sortOrder).toBe(5);
  });

  it('несуществующая картинка — 400, товар не создаётся', async () => {
    const prisma = stub([], ['m1']);
    await expect(
      service(prisma).create(
        { categoryId: 'c1', title: 'Т', imageIds: ['m1', 'gone'] },
        actor,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  it('без галереи главное фото берётся отдельно', async () => {
    const prisma = stub();
    await service(prisma).create(
      { categoryId: 'c1', title: 'Т', imageId: 'm9' },
      actor,
    );
    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ imageId: 'm9', images: undefined }),
      }),
    );
  });

  it('пустая галерея при правке очищает и её, и главное фото', async () => {
    const prisma = stub([existing]);
    await service(prisma).update('p1', { imageIds: [] }, actor);
    expect(prisma.productImage.deleteMany).toHaveBeenCalledWith({
      where: { productId: 'p1' },
    });
    expect(prisma.productImage.createMany).not.toHaveBeenCalled();
    expect(prisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ imageId: null }),
      }),
    );
  });

  it('новая галерея при правке переписывается целиком, главное фото — её первое', async () => {
    const prisma = stub([existing], ['m1', 'm2']);
    await service(prisma).update(
      'p1',
      { imageIds: ['m2', 'm1'], imageId: 'm1' },
      actor,
    );
    expect(prisma.productImage.createMany).toHaveBeenCalledWith({
      data: [
        { productId: 'p1', mediaId: 'm2', sortOrder: 0 },
        { productId: 'p1', mediaId: 'm1', sortOrder: 1 },
      ],
      skipDuplicates: true,
    });
    expect(prisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ imageId: 'm2' }),
      }),
    );
  });

  it('галерею не передали — её и главное фото не трогаем', async () => {
    const prisma = stub([existing]);
    await service(prisma).update('p1', { title: 'Новое' }, actor);
    expect(prisma.productImage.deleteMany).not.toHaveBeenCalled();
    const { data } = prisma.product.update.mock.calls[0][0] as { data: object };
    expect(data).not.toHaveProperty('imageId');
  });
});

describe('ProductsService: цена', () => {
  it('без цены — «по запросу», с ценой — нет', async () => {
    const prisma = stub();
    const svc = service(prisma);
    await svc.create({ categoryId: 'c1', title: 'A' }, actor);
    await svc.create({ categoryId: 'c1', title: 'B', priceFrom: 1000 }, actor);
    const flags = prisma.product.create.mock.calls.map(
      ([a]) => (a as { data: { priceOnRequest: boolean } }).data.priceOnRequest,
    );
    expect(flags).toEqual([true, false]);
  });
});

describe('ProductsService: публичная выдача', () => {
  const row = {
    slug: 'tank',
    title: 'Танк',
    description: null,
    sku: 'TK-1',
    specs: [{ key: 'Объём', value: '1 000 л' }, { key: 1 }, 'мусор', null],
    priceFrom: null,
    priceOnRequest: true,
    image: {
      storageKey: 'a.jpg',
      alt: '',
      width: 1,
      height: 1,
      blurDataUrl: null,
    },
    category: { slug: 'emkosti', title: 'Ёмкости' },
    facetValues: [
      { facetValue: { value: 'aisi304', group: { key: 'material' } } },
      { facetValue: { value: 'aisi316', group: { key: 'material' } } },
      { facetValue: { value: '500', group: { key: 'volume' } } },
    ],
    images: [] as unknown[],
  };

  it('битые характеристики отбрасываются, фасеты группируются, без галереи — одно главное фото', async () => {
    const prisma = stub();
    (prisma.product.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      row,
    );
    const result = await service(prisma).findOnePublic('emkosti', 'tank');

    expect(result.specs).toEqual([{ key: 'Объём', value: '1 000 л' }]);
    expect(result.facets).toEqual({
      material: ['aisi304', 'aisi316'],
      volume: ['500'],
    });
    expect(result.images).toEqual([
      expect.objectContaining({ url: 'https://tabys.kz/uploads/a.jpg' }),
    ]);
  });

  it('фильтры: И между группами, ИЛИ внутри группы', async () => {
    const prisma = stub();
    prisma.facetValue.findMany.mockResolvedValue([
      { id: 'f1', group: { key: 'material' } },
      { id: 'f2', group: { key: 'material' } },
      { id: 'f3', group: { key: 'volume' } },
    ]);
    await service(prisma).findAllPublic({
      facets: ['aisi304', 'aisi316', '500'],
    } as QueryProductsDto);

    const { where } = prisma.product.findMany.mock.calls[0][0] as {
      where: { AND: unknown };
    };
    expect(where.AND).toEqual([
      { facetValues: { some: { facetValueId: { in: ['f1', 'f2'] } } } },
      { facetValues: { some: { facetValueId: { in: ['f3'] } } } },
    ]);
  });

  it('неизвестный фильтр даёт пустую выдачу, а не весь каталог', async () => {
    const prisma = stub();
    await service(prisma).findAllPublic({
      facets: ['opechatka'],
    } as QueryProductsDto);
    const { where } = prisma.product.findMany.mock.calls[0][0] as {
      where: { AND: unknown };
    };
    expect(where.AND).toEqual([{ id: { in: [] } }]);
  });
});

describe('ProductsService: выгрузка CSV', () => {
  it('экранирует кавычки и формулы Excel, цену без значения пишет словами', async () => {
    const prisma = stub();
    prisma.product.findMany.mockResolvedValue([
      {
        sku: '=HYPERLINK("x")',
        title: 'Танк "Т-1"',
        slug: 'tank',
        priceFrom: null,
        priceOnRequest: true,
        status: 'DRAFT',
        category: { title: 'Ёмкости' },
      },
    ]);
    const csv = await service(prisma).exportCsv({} as QueryProductsDto);
    const [, line] = csv.split('\r\n');
    expect(line).toBe(
      `"'=HYPERLINK(""x"")";"Танк ""Т-1""";"Ёмкости";"по запросу";"Черновик";"tank"`,
    );
  });
});
