import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";
import { getCategories, getProducts } from "@/lib/api/catalog";
import { apiRead } from "@/lib/api/server";
import { uploadUrl } from "@/lib/api/url";
import {
  deleteProduct,
  reorderProducts,
  setProductStatus,
} from "@/lib/admin/catalog-actions";
import { formatPrice } from "@/lib/admin/format";
import {
  oneOf,
  pageParam,
  qParam,
  sortParam,
  textParam,
} from "@/lib/admin/search-params";
import { EmptyState, PageHeader, Panel } from "@/components/admin/page-header";
import { Table, Td, Th, Tr } from "@/components/admin/data-table";
import { Pagination } from "@/components/admin/pagination";
import { ListFilters } from "@/components/admin/list-filters";
import { DeleteButton, PublishToggle } from "@/components/admin/row-actions";
import { ReorderList } from "@/components/admin/reorder-list";
import { CategoryRail } from "@/components/admin/catalog/category-rail";
import { RowMenu } from "@/components/admin/catalog/row-menu";
import { Badge } from "@/components/ui/badge";
import { Download, ImageIcon, Pencil, Plus } from "@/components/ui/icons";
import { fieldBase, fieldBorder } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import type { CurrentUser } from "@/lib/api/types";

export const instant = false;

export const metadata: Metadata = { title: "Каталог оборудования" };

const SORTABLE = ["sortOrder", "title", "createdAt", "priceFrom"] as const;

const SORT_OPTIONS = [
  { value: "sortOrder:asc", label: "По порядку" },
  { value: "title:asc", label: "По названию" },
  { value: "createdAt:desc", label: "Сначала новые" },
  { value: "priceFrom:desc", label: "Сначала дорогие" },
] as const;

export default async function ProductsPage({
  searchParams,
}: PageProps<"/admin/catalog/products">) {
  const params = await searchParams;
  const category = textParam(params.category, 80);
  const status = oneOf(params.status, ["DRAFT", "PUBLISHED"] as const);
  const q = qParam(params.q);
  const page = pageParam(params.page);
  const sort = oneOf(
    params.sort,
    SORT_OPTIONS.map((option) => option.value),
  );
  const { sortBy, order } = sortParam(sort, SORTABLE);

  const [{ data, meta }, categories, me] = await Promise.all([
    getProducts({ category, status, q, page, sortBy, order }),
    getCategories(),
    apiRead<CurrentUser>("/auth/me"),
  ]);

  /** Адрес списка с текущими фильтрами — для пагинации, панели и возвратов. */
  const listHref = (
    extra: Record<string, string | number | undefined> = {},
  ) => {
    const search = new URLSearchParams();
    const all = { category, status, q, sort, page, ...extra };
    for (const [key, value] of Object.entries(all)) {
      if (value !== undefined && value !== "") search.set(key, String(value));
    }
    const query = search.toString();
    return `/admin/catalog/products${query ? `?${query}` : ""}`;
  };

  // Страница за пределом списка: иначе человек видит «ничего не найдено»
  // там, где товары есть, просто на других страницах.
  if (page && meta.total > 0 && page > meta.totalPages)
    redirect(listHref({ page: undefined }));

  // С карточки товара возвращаемся на список с теми же фильтрами.
  const backParam = `returnTo=${encodeURIComponent(listHref())}`;
  const productHref = (id: string) =>
    `/admin/catalog/products/${id}?${backParam}`;

  // Порядок правим только когда список — это вся категория целиком:
  // на отфильтрованном списке стрелки присвоили бы sortOrder 0..n
  // видимым товарам и перемешали бы их со скрытыми.
  const canReorder =
    Boolean(category) &&
    !q &&
    !status &&
    meta.totalPages === 1 &&
    data.length > 1;
  const totalProducts = categories.data.reduce(
    (sum, item) => sum + item._count.products,
    0,
  );

  return (
    <>
      <PageHeader
        title="Каталог оборудования"
        description="Управление каталогом продукции и оборудованием."
        breadcrumbs={[
          { label: "Каталог" },
          {
            label: category
              ? (categories.data.find((c) => c.slug === category)?.title ??
                "Товары")
              : "Все товары",
          },
        ]}
        actions={
          <>
            <a
              href={`/api/admin/products/export${listHref({ page: undefined }).replace("/admin/catalog/products", "")}`}
              className="inline-flex h-10 items-center gap-2 rounded-card border border-line bg-white px-4 text-[12.5px] font-medium transition-colors hover:border-ink hover:bg-muted"
            >
              <Download className="size-4" />
              Экспорт CSV
            </a>
            <Link
              href={`/admin/catalog/products/new?${backParam}${category ? `&category=${category}` : ""}`}
              prefetch={false}
              className="inline-flex h-10 items-center gap-2 rounded-card bg-accent px-4 text-[12.5px] font-medium text-white transition-colors hover:bg-accent-strong"
            >
              <Plus className="size-4" />
              Добавить товар
            </Link>
          </>
        }
      />

      <div className="grid gap-5 p-5 lg:grid-cols-[250px_1fr] lg:p-8">
        <CategoryRail
          categories={categories.data}
          active={category}
          total={totalProducts}
          hrefFor={(slug) =>
            listHref({ category: slug, page: undefined })
          }
        />

        <Panel className="min-w-0">
          <ListFilters
            action="/admin/catalog/products"
            searchValue={q}
            searchPlaceholder="Название или артикул"
            hidden={{ category, sort }}
          >
            <span className="w-[170px]">
              <select
                name="status"
                defaultValue={status ?? ""}
                aria-label="Статус"
                className={cn(
                  fieldBase,
                  "h-9 w-auto cursor-pointer pr-8",
                  fieldBorder(false),
                )}
              >
                <option value="">Любой статус</option>
                <option value="PUBLISHED">Опубликован</option>
                <option value="DRAFT">Черновик</option>
              </select>
            </span>
          </ListFilters>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-2.5">
            <p className="text-[12.5px] text-text-2">
              Найдено:{" "}
              <span className="font-medium text-ink">{meta.total}</span>
            </p>
            <form
              action="/admin/catalog/products"
              method="get"
              className="flex items-center gap-2"
            >
              {Object.entries({ category, status, q }).map(([name, value]) =>
                value ? (
                  <input key={name} type="hidden" name={name} value={value} />
                ) : null,
              )}
              <label htmlFor="sort" className="text-[12.5px] text-text-2">
                Сортировка
              </label>
              <span className="w-[170px]">
                <select
                  id="sort"
                  name="sort"
                  defaultValue={sort ?? "sortOrder:asc"}
                  className={cn(
                    fieldBase,
                    "h-9 w-auto cursor-pointer pr-8",
                    fieldBorder(false),
                  )}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </span>
              <button
                type="submit"
                className="inline-flex h-9 items-center rounded-card border border-line px-3 text-[12.5px] font-medium transition-colors hover:border-ink hover:bg-muted"
              >
                Применить
              </button>
            </form>
          </div>

          {data.length === 0 ? (
            <EmptyState
              message={
                q || category || status
                  ? "Ничего не найдено"
                  : "Товаров пока нет"
              }
              hint={
                q || category || status
                  ? "Измените фильтры или очистите поиск."
                  : "Добавьте первый товар кнопкой наверху."
              }
            />
          ) : (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th>Товар</Th>
                    <Th>Категория</Th>
                    <Th>Цена</Th>
                    <Th>Статус</Th>
                    <Th>
                      <span className="sr-only">Действия</span>
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((product) => (
                    <Tr key={product.id}>
                      <Td>
                        <Link
                          href={productHref(product.id)}
                          prefetch={false}
                          className="flex items-center gap-3"
                        >
                          <span className="relative size-11 shrink-0 overflow-hidden rounded-card bg-muted">
                            {product.image ? (
                              <Image
                                src={uploadUrl(product.image.storageKey)}
                                alt=""
                                fill
                                sizes="44px"
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <span className="grid size-full place-items-center text-text-2">
                                <ImageIcon className="size-4" />
                              </span>
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium hover:text-accent">
                              {product.title}
                            </span>
                            <span className="block truncate text-[12px] text-text-2">
                              {product.sku ?? product.slug ?? "—"}
                            </span>
                          </span>
                        </Link>
                      </Td>
                      <Td className="text-text-2">{product.category.title}</Td>
                      <Td className="whitespace-nowrap text-text-2">
                        {formatPrice(product.priceFrom, product.priceOnRequest)}
                      </Td>
                      <Td>
                        <Badge
                          tone={
                            product.status === "PUBLISHED" ? "ok" : "neutral"
                          }
                        >
                          {product.status === "PUBLISHED"
                            ? "Опубликован"
                            : "Черновик"}
                        </Badge>
                      </Td>
                      <Td>
                        <span className="flex items-start justify-end gap-2 whitespace-nowrap">
                          <Link
                            href={productHref(product.id)}
                            prefetch={false}
                            aria-label={`Редактировать: ${product.title}`}
                            className="grid size-8 place-items-center rounded-card border border-line text-text-2 transition-colors hover:border-accent hover:text-accent"
                          >
                            <Pencil className="size-4" />
                          </Link>
                          <RowMenu label={`Действия: ${product.title}`}>
                            <PublishToggle
                              id={product.id}
                              published={product.status === "PUBLISHED"}
                              action={setProductStatus}
                            />
                            {me.role === "OWNER" ? (
                              <DeleteButton
                                id={product.id}
                                action={deleteProduct}
                                returnTo={listHref()}
                              />
                            ) : null}
                          </RowMenu>
                        </span>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>

              <Pagination
                basePath="/admin/catalog/products"
                params={{ category, status, q, sort }}
                meta={meta}
              />
            </>
          )}
        </Panel>
      </div>

      {canReorder ? (
        <div className="px-5 pb-5 lg:px-8 lg:pb-8">
          <Panel title="Порядок внутри категории">
            <ReorderList
              items={data.map((product) => ({
                id: product.id,
                title: product.title,
              }))}
              action={reorderProducts}
            />
          </Panel>
        </div>
      ) : null}
    </>
  );
}
