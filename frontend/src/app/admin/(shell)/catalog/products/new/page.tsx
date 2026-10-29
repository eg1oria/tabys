import type { Metadata } from "next";
import { getCategories } from "@/lib/api/catalog";
import { getFormOptions } from "@/lib/admin/catalog-form-data";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { ImagePicker } from "@/components/admin/image-picker";
import { FacetPicker } from "@/components/admin/facet-picker";

export const instant = false;

export const metadata: Metadata = { title: "Новый товар" };

export default async function NewProductPage({
  searchParams,
}: PageProps<"/admin/catalog/products/new">) {
  const params = await searchParams;
  const [{ groups, images }, categories] = await Promise.all([
    getFormOptions(),
    getCategories(),
  ]);

  // ?category=<slug> приходит со страницы списка — подставляем категорию.
  const preselected = categories.data.find((item) => item.slug === params.category);

  return (
    <>
      <PageHeader title="Новый товар" />
      <div className="p-5 lg:p-8">
        <ProductForm
          product={null}
          categories={categories.data.map((item) => ({ id: item.id, title: item.title }))}
          defaultCategoryId={preselected?.id}
          imagePicker={<ImagePicker images={images} value={null} current={null} />}
          facetPicker={<FacetPicker groups={groups} selected={[]} />}
        />
      </div>
    </>
  );
}
