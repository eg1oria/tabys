import type { Metadata } from "next";
import Link from "next/link";
import { getCategories } from "@/lib/api/catalog";
import { apiRead } from "@/lib/api/server";
import type { CurrentUser } from "@/lib/api/types";
import { deleteCategory, reorderCategories, setCategoryStatus } from "@/lib/admin/catalog-actions";
import { EmptyState, PageHeader, Panel } from "@/components/admin/page-header";
import { Table, Td, Th, Tr } from "@/components/admin/data-table";
import { ReorderList } from "@/components/admin/reorder-list";
import { DeleteButton, PublishToggle } from "@/components/admin/row-actions";
import { Badge } from "@/components/ui/badge";
import { Plus } from "@/components/ui/icons";

/**
 * Страница читает данные под авторизацией на каждый запрос: кешировать
 * их нечем, мгновенной навигация быть не может. Проверка instant
 * выключена осознанно (см. комментарий в src/app/admin/layout.tsx).
 */
export const instant = false;

export const metadata: Metadata = { title: "Категории" };

export default async function CategoriesPage() {
  // Удалять категории бэкенд разрешает только владельцу: показывать
  // редактору кнопку, которая всегда отвечает 403, незачем.
  const [{ data }, me] = await Promise.all([
    getCategories(),
    apiRead<CurrentUser>("/auth/me"),
  ]);

  return (
    <>
      <PageHeader
        title="Категории"
        description="Разделы каталога. Снятая с публикации категория пропадает с сайта вместе с товарами."
        breadcrumbs={[{ label: "Каталог" }, { label: "Категории" }]}
        actions={
          <Link
            href="/admin/catalog/categories/new"
            prefetch={false}
            className="inline-flex h-9 items-center gap-2 rounded-card bg-accent px-4 text-[12.5px] font-medium text-white transition-colors hover:bg-accent-strong"
          >
            <Plus className="size-4" />
            Новая категория
          </Link>
        }
      />

      <div className="space-y-5 p-5 lg:p-8">
        <Panel title={`Всего: ${data.length}`}>
          {data.length === 0 ? (
            <EmptyState message="Категорий пока нет" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Название</Th>
                  <Th>Адрес</Th>
                  <Th>Товаров</Th>
                  <Th>Статус</Th>
                  <Th>
                    <span className="sr-only">Действия</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {data.map((category) => (
                  <Tr key={category.id}>
                    <Td>
                      <Link
                        href={`/admin/catalog/categories/${category.id}`}
                        prefetch={false}
                        className="font-medium hover:text-accent"
                      >
                        {category.title}
                      </Link>
                    </Td>
                    <Td className="text-text-2">/{category.slug}</Td>
                    <Td className="text-text-2">
                      {category.positionCount ?? category._count.products}
                      {category.positionCount !== null ? (
                        <span
                          className="ml-1 text-[11.5px]"
                          title={`Витринное число. Реально товаров: ${category._count.products}`}
                        >
                          *
                        </span>
                      ) : null}
                    </Td>
                    <Td>
                      <Badge tone={category.status === "PUBLISHED" ? "ok" : "neutral"}>
                        {category.status === "PUBLISHED" ? "На сайте" : "Черновик"}
                      </Badge>
                    </Td>
                    <Td>
                      <span className="flex items-start justify-end gap-2 whitespace-nowrap">
                        <PublishToggle
                          id={category.id}
                          published={category.status === "PUBLISHED"}
                          action={setCategoryStatus}
                        />
                        {me.role === "OWNER" ? (
                          <DeleteButton
                            id={category.id}
                            action={deleteCategory}
                            // Бэкенд удаляет категорию вместе с её товарами —
                            // об этом надо предупредить до, а не после.
                            confirmLabel={
                              category._count.products > 0
                                ? `Удалить и ${category._count.products} товаров`
                                : "Точно удалить"
                            }
                          />
                        ) : null}
                      </span>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>

        {data.length > 1 ? (
          <Panel title="Порядок на сайте">
            <ReorderList
              items={data.map((category) => ({ id: category.id, title: category.title }))}
              action={reorderCategories}
            />
          </Panel>
        ) : null}
      </div>
    </>
  );
}
