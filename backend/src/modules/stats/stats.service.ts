import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LeadStatus, PublishStatus } from '../../prisma/client.js';
import type { QueryStatsDto } from './dto/query-stats.dto.js';

/**
 * Казахстан живёт в UTC+5 круглый год (перевода часов нет с 2005 года,
 * единый пояс — с марта 2024), поэтому границы суток считаем фиксированным
 * смещением: это точнее, чем гадать по серверному часовому поясу.
 */
const TZ = 'Asia/Almaty';
const TZ_OFFSET = '+05:00';

const DAY_MS = 86_400_000;
const DEFAULT_DAYS = 30;
const MAX_DAYS = 366;

/** Спам — не заявка: в сумме и на графике его не показываем. */
const REAL_LEADS = { status: { not: LeadStatus.SPAM } } as const;

type DayRow = { day: Date; count: number };

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(dto: QueryStatsDto) {
    const { from, to } = this.range(dto);
    const length = to.getTime() - from.getTime();
    const previousFrom = new Date(from.getTime() - length);

    const [
      byStatus,
      previousTotal,
      series,
      products,
      publishedProducts,
      categories,
      publishedCategories,
      media,
      topCategories,
      latestLeads,
    ] = await Promise.all([
      this.prisma.lead.groupBy({
        by: ['status'],
        where: { createdAt: { gte: from, lt: to } },
        _count: { _all: true },
      }),
      this.prisma.lead.count({
        where: { createdAt: { gte: previousFrom, lt: from }, ...REAL_LEADS },
      }),
      this.series(from, to),
      this.prisma.product.count(),
      this.prisma.product.count({ where: { status: PublishStatus.PUBLISHED } }),
      this.prisma.category.count(),
      this.prisma.category.count({
        where: { status: PublishStatus.PUBLISHED },
      }),
      this.prisma.mediaAsset.aggregate({
        _count: { _all: true },
        _sum: { bytes: true },
      }),
      this.prisma.category.findMany({
        orderBy: [{ sortOrder: 'asc' }],
        take: 6,
        select: {
          id: true,
          title: true,
          slug: true,
          _count: { select: { products: true } },
        },
      }),
      this.prisma.lead.findMany({
        where: REAL_LEADS,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          message: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const counts = Object.fromEntries(
      Object.values(LeadStatus).map((status) => [status, 0]),
    ) as Record<LeadStatus, number>;
    for (const row of byStatus) counts[row.status] = row._count._all;

    return {
      range: {
        from: this.isoDay(from),
        to: this.isoDay(new Date(to.getTime() - DAY_MS)),
        previousFrom: this.isoDay(previousFrom),
      },
      leads: {
        total: counts.NEW + counts.IN_PROGRESS + counts.DONE,
        previousTotal,
        byStatus: counts,
      },
      series,
      catalog: {
        products: {
          total: products,
          published: publishedProducts,
          draft: products - publishedProducts,
        },
        categories: { total: categories, published: publishedCategories },
        media: { total: media._count._all, bytes: media._sum.bytes ?? 0 },
      },
      topCategories: topCategories
        .map(({ _count, ...rest }) => ({ ...rest, products: _count.products }))
        .sort((a, b) => b.products - a.products),
      latestLeads,
    };
  }

  /**
   * Заявки по дням. groupBy в Prisma не умеет date_trunc, поэтому сырой SQL;
   * COUNT(*) приводим к int прямо в запросе — bigint не сериализуется в JSON.
   */
  private async series(from: Date, to: Date) {
    const rows = await this.prisma.$queryRaw<DayRow[]>`
      SELECT (("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${TZ})::date) AS day,
             COUNT(*)::int AS count
        FROM "Lead"
       WHERE "createdAt" >= ${from}
         AND "createdAt" < ${to}
         AND "status" <> 'SPAM'::"LeadStatus"
       GROUP BY 1
       ORDER BY 1
    `;

    const byDay = new Map(
      rows.map((row) => [this.isoDay(row.day), Number(row.count)]),
    );

    // Дни без заявок в выборку не попадают, а на графике разрыв выглядел бы
    // как пропуск данных — достраиваем нулями.
    const days: { date: string; count: number }[] = [];
    for (let time = from.getTime(); time < to.getTime(); time += DAY_MS) {
      const date = this.isoDay(new Date(time));
      days.push({ date, count: byDay.get(date) ?? 0 });
    }
    return days;
  }

  /** Полуинтервал [from, to): to — начало дня, следующего за запрошенным. */
  private range(dto: QueryStatsDto): { from: Date; to: Date } {
    const today = this.isoDay(new Date());
    const toDay = dto.to ? this.isoDay(this.parseDay(dto.to)) : today;
    const fromDay = dto.from
      ? this.isoDay(this.parseDay(dto.from))
      : this.isoDay(
          new Date(this.startOf(toDay).getTime() - (DEFAULT_DAYS - 1) * DAY_MS),
        );

    const from = this.startOf(fromDay);
    const to = new Date(this.startOf(toDay).getTime() + DAY_MS);

    if (from >= to) throw new BadRequestException('Начало периода позже конца');
    if (to.getTime() - from.getTime() > MAX_DAYS * DAY_MS) {
      throw new BadRequestException(`Период не длиннее ${MAX_DAYS} дней`);
    }
    return { from, to };
  }

  private parseDay(value: string): Date {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime()))
      throw new BadRequestException('Некорректная дата');
    return parsed;
  }

  /** Начало суток в Алматы. */
  private startOf(isoDay: string): Date {
    return new Date(`${isoDay}T00:00:00${TZ_OFFSET}`);
  }

  private isoDay(date: Date): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }
}
