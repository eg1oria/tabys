import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategory } from "@/lib/api/catalog";
import { currentImage, getFormOptions } from "@/lib/admin/catalog-form-data";
import { ApiError } from "@/lib/api/errors";
import { PageHeader } from "@/components/admin/page-header";
import { CategoryForm } from "@/components/admin/category-form";
import { ImagePicker } from "@/components/admin/image-picker";
import { FacetPicker } from "@/components/admin/facet-picker";
import { Badge } from "@/components/ui/badge";
import type { AdminCategory } from "@/lib/api/types";

export const instant = false;

export const metadata: Metadata = { title: "Категория" };

export default async function EditCategoryPage({
  params,
}: PageProps<"/admin/catalog/categories/[id]">) {
  const { id } = await params;

  let category: AdminCategory;
  try {
    category = await getCategory(id);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) notFound();
    throw error;
  }

  const { groups, images, assets } = await getFormOptions();
  const selected = category.facetValues.map((link) => link.facetValueId);

  return (
    <>
      <PageHeader
        title={category.title}
        description={`/${category.slug} · товаров: ${category._count.products}`}
        actions={
          <Badge tone={category.status === "PUBLISHED" ? "ok" : "neutral"}>
            {category.status === "PUBLISHED" ? "На сайте" : "Черновик"}
          </Badge>
        }
      />
      <div className="p-5 lg:p-8">
        <CategoryForm
          category={category}
          imagePicker={
            <ImagePicker
              images={images}
              value={category.imageId}
              current={currentImage(assets, category.imageId)}
            />
          }
          facetPicker={<FacetPicker groups={groups} selected={selected} />}
        />
      </div>
    </>
  );
}
