import { BadRequestException } from '@nestjs/common';
import { StatsService } from './stats.service.js';
import type { PrismaService } from '../../prisma/prisma.service.js';

/** Минимальная заглушка Prisma: сводке нужны только эти вызовы. */
function prismaStub(days: { day: Date; count: number }[]) {
  const aggregate = { _count: { _all: 0 }, _sum: { bytes: null } };
  return {
    lead: {
      groupBy: vi
        .fn()
        .mockResolvedValue([{ status: 'NEW', _count: { _all: 3 } }]),
      count: vi.fn().mockResolvedValue(1),
      findMany: vi.fn().mockResolvedValue([]),
    },
    product: { count: vi.fn().mockResolvedValue(0) },
    category: {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
    },
    mediaAsset: { aggregate: vi.fn().mockResolvedValue(aggregate) },
    telegramBot: { count: vi.fn().mockResolvedValue(0) },
    telegramChat: { count: vi.fn().mockResolvedValue(0) },
    $queryRaw: vi.fn().mockResolvedValue(days),
  } as unknown as PrismaService;
}

describe('StatsService', () => {
  it('достраивает нулями дни без заявок — иначе на графике разрыв', async () => {
    const service = new StatsService(
      prismaStub([{ day: new Date('2026-10-02T00:00:00+05:00'), count: 2 }]),
    );

    const { series } = await service.summary({
      from: '2026-10-01',
      to: '2026-10-03',
    });

    expect(series).toEqual([
      { date: '2026-10-01', count: 0 },
      { date: '2026-10-02', count: 2 },
      { date: '2026-10-03', count: 0 },
    ]);
  });

  it('спам не попадает в сумму заявок', async () => {
    const prisma = prismaStub([]);
    (prisma.lead.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([
      { status: 'NEW', _count: { _all: 2 } },
      { status: 'SPAM', _count: { _all: 7 } },
    ]);
    const service = new StatsService(prisma);

    const { leads } = await service.summary({
      from: '2026-10-01',
      to: '2026-10-01',
    });

    expect(leads.total).toBe(2);
    expect(leads.byStatus.SPAM).toBe(7);
  });

  it('отвергает перевёрнутый и слишком длинный период', async () => {
    const service = new StatsService(prismaStub([]));

    await expect(
      service.summary({ from: '2026-10-05', to: '2026-10-01' }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.summary({ from: '2020-01-01', to: '2026-10-01' }),
    ).rejects.toThrow(BadRequestException);
  });
});
