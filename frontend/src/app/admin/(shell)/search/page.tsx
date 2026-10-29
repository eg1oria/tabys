import type { Metadata } from "next";
import Link from "next/link";
import { getCategories, getProducts } from "@/lib/api/catalog";
import { getLeads } from "@/lib/api/leads";
import { qParam } from "@/lib/admin/search-params";
import { formatDateTime, formatPrice } from "@/lib/admin/format";
import { LEAD_STATUS_LABEL, LEAD_STATUS_TONE } from "@/lib/admin/lead-status";
import { EmptyState, PageHeader, Panel } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";

export const instant = false;

export const metadata: Metadata = { title: "Поиск" };

/**
 * Общий поиск из шапки. Отдельной ручки на бэкенде нет и не нужно:
 * три списочных эндпоинта уже умеют ?q, спрашиваем их параллельно.
 */
export default async function AdminSearchPage({ searchParams }: PageProps<"/admin/search">) {
  const params = await searchParams;
  const q = qParam(params.q);

  if (!q) {
    return (
      <>
        <PageHeader title="Поиск" breadcrumbs={[{ label: "Поиск" }]} />
        <div className="p-5 lg:p-8">
          <Panel>
            <EmptyState
              message="Что ищем?"
              hint="Введите название товара, артикул, категорию или имя заказчика в поле наверху."
            />
          </Panel>
        </div>
      </>
    );
  }

  const [products, categories, leads] = await Promise.all([
    getProducts({ q, perPage: 5 }),
    getCategories({ q }),
    getLeads({ q, perPage: 5 }),
  ]);

  const nothing =
    products.data.length === 0 && categories.data.length === 0 && leads.data.length === 0;

  return (
    <>
      <PageHeader
        title={`Поиск: ${q}`}
        description={`Найдено: товаров ${products.meta.total}, категорий ${categories.meta.total}, заявок ${leads.meta.total}.`}
        breadcrumbs={[{ label: "Поиск" }]}
      />

      <div className="space-y-5 p-5 lg:p-8">
        {nothing ? (
          <Panel>
            <EmptyState message="Ничего не нашлось" hint="Проверьте написание или часть слова." />
          </Panel>
        ) : null}

        {products.data.length > 0 ? (
          <Panel
            title="Товары"
            actions={
              <Link
                href={`/admin/catalog/products?q=${encodeURIComponent(q)}`}
                prefetch={false}
                className="text-[12px] font-medium text-accent"
              >
                Все {products.meta.total} →
              </Link>
            }
          >
            <ul className="divide-y divide-line">
              {products.data.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/admin/catalog/products?edit=${product.id}`}
                    prefetch={false}
                    className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-muted"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium">
                        {product.title}
                      </span>
                      <span className="block truncate text-[12px] text-text-2">
                        {product.sku ? `${product.sku} · ` : ""}
                        {product.category.title}
                      </span>
                    </span>
                    <span className="shrink-0 text-[12.5px] text-text-2">
                      {formatPrice(product.priceFrom, product.priceOnRequest)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}

        {categories.data.length > 0 ? (
          <Panel title="Категории">
            <ul className="divide-y divide-line">
              {categories.data.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/admin/catalog/categories/${category.id}`}
                    prefetch={false}
                    className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-muted"
                  >
                    <span className="min-w-0 truncate text-[13px] font-medium">
                      {category.title}
                    </span>
                    <span className="shrink-0 text-[12.5px] text-text-2">
                      {category._count.products} товаров
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}

        {leads.data.length > 0 ? (
          <Panel
            title="Заявки"
            actions={
              <Link
                href={`/admin/leads?q=${encodeURIComponent(q)}`}
                prefetch={false}
                className="text-[12px] font-medium text-accent"
              >
                Все {leads.meta.total} →
              </Link>
            }
          >
            <ul className="divide-y divide-line">
              {leads.data.map((lead) => (
                <li key={lead.id}>
                  <Link
                    href={`/admin/leads/${lead.id}`}
                    prefetch={false}
                    className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-muted"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium">{lead.name}</span>
                      <span className="block truncate text-[12px] text-text-2">
                        {lead.phone} · {formatDateTime(lead.createdAt)}
                      </span>
                    </span>
                    <Badge tone={LEAD_STATUS_TONE[lead.status]}>
                      {LEAD_STATUS_LABEL[lead.status]}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}
      </div>
    </>
  );
}
