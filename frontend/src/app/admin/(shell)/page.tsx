import type { Metadata } from "next";
import Link from "next/link";
import { getStats } from "@/lib/api/stats";
import { textParam } from "@/lib/admin/search-params";
import { formatBytes } from "@/lib/admin/format";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/dashboard/stat-card";
import { LeadsChart } from "@/components/admin/dashboard/leads-chart";
import { StatusDonut } from "@/components/admin/dashboard/status-donut";
import { LatestLeads } from "@/components/admin/dashboard/latest-leads";
import { DateRange } from "@/components/admin/dashboard/date-range";
import { Table, Td, Th, Tr } from "@/components/admin/data-table";
import { ArrowRight, ChartUp, ImageIcon, Inbox, Modules } from "@/components/ui/icons";

export const instant = false;

export const metadata: Metadata = { title: "Главная" };

/** Дата в формате YYYY-MM-DD со сдвигом в днях от сегодняшнего дня в Алматы. */
function day(offset: number, now: Date): string {
  const shifted = new Date(now.getTime() + offset * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Almaty",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(shifted);
}

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  const params = await searchParams;
  // Даты проверяет бэкенд, здесь лишь отсекаем явный мусор из адреса.
  const from = textParam(params.from, 10);
  const to = textParam(params.to, 10);

  const stats = await getStats({ from, to });

  // «Сегодня» берём из ответа бэкенда: собственный new Date() при
  // cacheComponents запрещён, да и пояс сервера может отличаться.
  const today = new Date(`${stats.range.to}T00:00:00+05:00`);
  const presets = [
    { label: "7 дней", from: day(-6, today), to: stats.range.to },
    { label: "30 дней", from: day(-29, today), to: stats.range.to },
    { label: "90 дней", from: day(-89, today), to: stats.range.to },
  ];

  const { leads, catalog } = stats;

  return (
    <>
      <PageHeader
        title="Главная"
        description="Обзор заявок и каталога."
        breadcrumbs={[{ label: "Главная" }]}
        actions={<DateRange from={stats.range.from} to={stats.range.to} presets={presets} />}
      />

      <div className="space-y-5 p-5 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Заявки за период"
            value={leads.total}
            delta={{ current: leads.total, previous: leads.previousTotal }}
            caption={`Предыдущий период: ${leads.previousTotal}`}
            icon={<Inbox className="size-5" />}
          />
          <StatCard
            label="Новые"
            value={leads.byStatus.NEW}
            caption="Ждут ответа"
            icon={<ChartUp className="size-5" />}
          />
          <StatCard
            label="Товаров в каталоге"
            value={catalog.products.total}
            caption={`Опубликовано ${catalog.products.published}, черновиков ${catalog.products.draft}`}
            icon={<Modules className="size-5" />}
          />
          <StatCard
            label="Файлов в медиатеке"
            value={catalog.media.total}
            caption={formatBytes(catalog.media.bytes)}
            icon={<ImageIcon className="size-5" />}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <Panel title="Динамика заявок">
              <div className="px-3 py-4">
                <LeadsChart series={stats.series} />
              </div>
            </Panel>

            <div className="grid gap-5 lg:grid-cols-2">
              <Panel title="Заявки по статусам">
                <StatusDonut counts={leads.byStatus} />
              </Panel>

              <Panel title="Категории по числу товаров">
                {stats.topCategories.length === 0 ? (
                  <p className="px-5 py-10 text-center text-[13px] text-text-2">
                    Категорий пока нет
                  </p>
                ) : (
                  <Table>
                    <thead>
                      <tr>
                        <Th>Категория</Th>
                        <Th>Товаров</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topCategories.map((category) => (
                        <Tr key={category.id}>
                          <Td>
                            <Link
                              href={`/admin/catalog/products?category=${category.slug}`}
                              prefetch={false}
                              className="font-medium hover:text-accent"
                            >
                              {category.title}
                            </Link>
                          </Td>
                          <Td className="text-text-2">{category.products}</Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Panel>
            </div>
          </div>

          <Panel
            title="Новые заявки"
            actions={
              <Link
                href="/admin/leads"
                prefetch={false}
                className="group inline-flex items-center gap-1.5 text-[12px] font-medium text-accent"
              >
                Все заявки
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            }
          >
            <LatestLeads leads={stats.latestLeads} />
          </Panel>
        </div>
      </div>
    </>
  );
}
