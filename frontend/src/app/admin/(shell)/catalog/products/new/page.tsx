import type { Metadata } from "next";
import { getCategories } from "@/lib/api/catalog";
import { getFormOptions } from "@/lib/admin/catalog-form-data";
import { safeNext } from "@/lib/admin/form-state";
import { textParam } from "@/lib/admin/search-params";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { FacetPicker } from "@/components/admin/facet-picker";

export const instant = false;

export const metadata: Metadata = { title: "Новый товар" };

export default async function NewProductPage({
  searchParams,
}: PageProps<"/admin/catalog/products/new">) {
  const params = await searchParams;
  const categorySlug = textParam(params.category, 80);
  const returnTo = safeNext(textParam(params.returnTo, 300), "/admin/catalog/products");

  const [{ groups, images }, categories] = await Promise.all([getFormOptions(), getCategories()]);

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Каталог" },
          { label: "Все товары", href: returnTo },
          { label: "Новый товар" },
        ]}
        title="Новый товар"
        description="Товар появится на сайте сразу, если оставить статус «Опубликован»."
      />
      <div className="p-5 lg:p-8">
        <ProductForm
          product={null}
          categories={categories.data.map((item) => ({ id: item.id, title: item.title }))}
          defaultCategoryId={
            categorySlug ? categories.data.find((item) => item.slug === categorySlug)?.id : undefined
          }
          gallery={[]}
          library={images}
          returnTo={returnTo}
          facetPicker={<FacetPicker groups={groups} selected={[]} />}
        />
      </div>
    </>
  );
}
