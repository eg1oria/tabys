import { NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import {
  toPublicCategory,
  type PublicCategoryRow,
} from './categories.mapper.js';
import { PublishStatus } from '../../prisma/client.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import type { AppConfigService } from '../../config/app-config.service.js';
import type { AuditService } from '../../common/audit/audit.service.js';
import type { AuthUser } from '../../auth/types.js';

const actor: AuthUser = { id: 'u1', email: 'e@tabys.kz', role: 'EDITOR' };

function stub(takenSlugs: string[] = []) {
  const prisma = {
    category: {
      findUnique: vi.fn(
        async ({ where }: { where: { slug?: string; id?: string } }) => {
          if (where.slug)
            return takenSlugs.includes(where.slug) ? { id: 'x' } : null;
          return where.id === 'c1'
            ? { id: 'c1', status: PublishStatus.DRAFT }
            : null;
        },
      ),
      findFirst: vi.fn().mockResolvedValue({ sortOrder: 11 }),
      create: vi.fn(async ({ data }: { data: object }) => ({
        id: 'new',
        ...data,
      })),
      update: vi.fn(async ({ data }: { data: object }) => ({
        id: 'c1',
        ...data,
      })),
    },
    categoryFacetValue: { deleteMany: vi.fn(), createMany: vi.fn() },
    $transaction: vi.fn(),
  };
  prisma.$transaction.mockImplementation(
    async (fn: (tx: typeof prisma) => unknown) => fn(prisma),
  );
  return prisma;
}

function service(prisma: ReturnType<typeof stub>) {
  return new CategoriesService(
    prisma as unknown as PrismaService,
    { publicUrl: 'https://tabys.kz' } as AppConfigService,
    { log: vi.fn() } as unknown as AuditService,
  );
}

describe('CategoriesService', () => {
  it('новая категория: слаг из названия с суффиксом, краткое имя = название, в конец списка', async () => {
    const prisma = stub(['emkosti']);
    await service(prisma).create({ title: 'Ёмкости', description: '' }, actor);
    expect(prisma.category.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slug: 'emkosti-2',
          short: 'Ёмкости',
          highlights: [],
          sortOrder: 12,
        }),
      }),
    );
  });

  it('список фильтров при правке задаётся целиком; пустой — очищает', async () => {
    const prisma = stub();
    const svc = service(prisma);

    await svc.update('c1', { facetValueIds: ['f1', 'f2'] }, actor);
    expect(prisma.categoryFacetValue.deleteMany).toHaveBeenCalledWith({
      where: { categoryId: 'c1' },
    });
    expect(prisma.categoryFacetValue.createMany).toHaveBeenCalledWith({
      data: [
        { categoryId: 'c1', facetValueId: 'f1' },
        { categoryId: 'c1', facetValueId: 'f2' },
      ],
      skipDuplicates: true,
    });

    prisma.categoryFacetValue.createMany.mockClear();
    await svc.update('c1', { facetValueIds: [] }, actor);
    expect(prisma.categoryFacetValue.createMany).not.toHaveBeenCalled();
  });

  it('правка без списка фильтров их не трогает', async () => {
    const prisma = stub();
    await service(prisma).update('c1', { title: 'Новое' }, actor);
    expect(prisma.categoryFacetValue.deleteMany).not.toHaveBeenCalled();
  });

  it('публикация ставит дату, снятие — стирает', async () => {
    const prisma = stub();
    const svc = service(prisma);
    await svc.setStatus('c1', PublishStatus.PUBLISHED, actor);
    await svc.setStatus('c1', PublishStatus.DRAFT, actor);
    const dates = prisma.category.update.mock.calls.map(
      ([a]) => (a as { data: { publishedAt: Date | null } }).data.publishedAt,
    );
    expect(dates[0]).toBeInstanceOf(Date);
    expect(dates[1]).toBeNull();
  });

  it('нет категории — 404, и в базу ничего не пишется', async () => {
    const prisma = stub();
    await expect(
      service(prisma).setStatus('nope', PublishStatus.PUBLISHED, actor),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.category.update).not.toHaveBeenCalled();
  });
});

describe('toPublicCategory', () => {
  const row: PublicCategoryRow = {
    slug: 'uplotneniya',
    title: 'Торцевые уплотнения',
    short: 'Уплотнения',
    description: '',
    highlights: [],
    positionCount: 20,
    seoTitle: null,
    seoDescription: null,
    image: {
      storageKey: 'seed/u.jpg',
      alt: 'Уплотнение',
      width: 10,
      height: 10,
      blurDataUrl: null,
    },
    facetValues: [
      { facetValue: { value: 'aisi316', group: { key: 'material' } } },
      { facetValue: { value: 'title', group: { key: 'title' } } },
    ],
    products: [{ title: 'A' }],
    _count: { products: 5 },
  };

  it('витринное число важнее фактического, а без него — число товаров', () => {
    expect(toPublicCategory(row, 'https://tabys.kz').count).toBe(20);
    expect(
      toPublicCategory({ ...row, positionCount: null }, 'https://tabys.kz')
        .count,
    ).toBe(5);
  });

  it('фасет с ключом title не затирает поле категории', () => {
    const result = toPublicCategory(row, 'https://tabys.kz');
    expect(result.title).toBe('Торцевые уплотнения');
    expect(result.facets).toEqual({ material: ['aisi316'], title: ['title'] });
  });
});
