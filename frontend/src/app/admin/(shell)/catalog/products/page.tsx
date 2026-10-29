import type { Metadata } from "next";
import Link from "next/link";
import { getCategories, getProducts } from "@/lib/api/catalog";
import { deleteProduct, reorderProducts, setProductStatus } from "@/lib/admin/catalog-actions";
import { formatPrice } from "@/lib/admin/format";
import { EmptyState, PageHeader, Panel } from "@/components/admin/page-header";
import { Table, Td, Th, Tr } from "@/components/admin/data-table";
import { Pagination } from "@/components/admin/pagination";
import { ListFilters } from "@/components/admin/list-filters";
import { ReorderList } from "@/components/admin/reorder-list";
import { DeleteButton, PublishToggle } from "@/components/admin/row-actions";
import { Badge } from "@/components/ui/badge";
import { Plus } from "@/components/ui/icons";
import { fieldBase, fieldBorder } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import type { PublishStatus } from "@/lib/api/types";

export const instant = false;

export const metadata: Metadata = { title: "Товары" };

export default async function ProductsPage({ searchParams }: PageProps<"/admin/catalog/products">) {
  const params = await searchParams;
  const category = typeof params.category === "string" && params.category !== "" ? params.category : undefined;
  const status =
    params.status === "DRAFT" || params.status === "PUBLISHED"
      ? (params.status as PublishStatus)
      : undefined;
  const q = typeof params.q === "string" && params.q !== "" ? params.q : undefined;
  const page = Number(params.page) > 1 ? Number(params.page) : undefined;

  const [{ data, meta }, categories] = await Promise.all([
    getProducts({ category, status, q, page }),
    getCategories(),
  ]);

  // Порядок у товара свой внутри категории, поэтому стрелки показываем
  // только когда список сведён к одной категории и помещается на странице.
  const canReorder = Boolean(category) && meta.totalPages === 1 && data.length > 1;

  return (
    <>
      <PageHeader
        title="Товары"
        description="Позиции каталога внутри категорий."
        actions={
          <Link
            href="/admin/catalog/products/new"
            prefetch={false}
            className="inline-flex h-9 items-center gap-2 rounded-card bg-accent px-4 text-[12.5px] font-medium text-white transition-colors hover:bg-accent-strong"
          >
            <Plus className="size-4" />
            Новый товар
          </Link>
        }
      />

      <div className="space-y-5 p-5 lg:p-8">
        <Panel>
          <ListFilters action="/admin/catalog/products" searchValue={q} searchPlaceholder="Название товара">
            <select
              name="category"
              defaultValue={category ?? ""}
              aria-label="Категория"
              className={cn(fieldBase, "h-9 w-auto cursor-pointer pr-8", fieldBorder(false))}
            >
              <option value="">Все категории</option>
              {categories.data.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.title}
                </option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={status ?? ""}
              aria-label="Статус"
              className={cn(fieldBase, "h-9 w-auto cursor-pointer pr-8", fieldBorder(false))}
            >
              <option value="">Любой статус</option>
              <option value="PUBLISHED">На сайте</option>
              <option value="DRAFT">Черновик</option>
            </select>
          </ListFilters>

          {data.length === 0 ? (
            <EmptyState
              message={q || category || status ? "Ничего не найдено" : "Товаров пока нет"}
            />
          ) : (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th>Название</Th>
                    <Th>Категория</Th>
                    <Th>Цена</Th>
                    <Th>Статус</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {data.map((product) => (
                    <Tr key={product.id}>
                      <Td>
                        <Link
                          href={`/admin/catalog/products/${product.id}`}
                          prefetch={false}
                          className="font-medium hover:text-accent"
                        >
                          {product.title}
                        </Link>
                      </Td>
                      <Td className="text-text-2">{product.category.title}</Td>
                      <Td className="whitespace-nowrap text-text-2">
                        {formatPrice(product.priceFrom, product.priceOnRequest)}
                      </Td>
                      <Td>
                        <Badge tone={product.status === "PUBLISHED" ? "ok" : "neutral"}>
                          {product.status === "PUBLISHED" ? "На сайте" : "Черновик"}
                        </Badge>
                      </Td>
                      <Td>
                        <span className="flex items-start justify-end gap-2 whitespace-nowrap">
                          <PublishToggle
                            id={product.id}
                            published={product.status === "PUBLISHED"}
                            action={setProductStatus}
                          />
                          <DeleteButton id={product.id} action={deleteProduct} />
                        </span>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>

              <Pagination
                basePath="/admin/catalog/products"
                params={{ category, status, q }}
                meta={meta}
              />
            </>
          )}
        </Panel>

        {canReorder ? (
          <Panel title="Порядок внутри категории">
            <ReorderList
              items={data.map((product) => ({ id: product.id, title: product.title }))}
              action={reorderProducts}
            />
          </Panel>
        ) : null}
      </div>
    </>
  );
}
