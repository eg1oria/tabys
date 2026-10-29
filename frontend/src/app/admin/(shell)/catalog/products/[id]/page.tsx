import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories, getProduct } from "@/lib/api/catalog";
import { currentImage, getFormOptions, withCurrentImage } from "@/lib/admin/catalog-form-data";
import { ApiError } from "@/lib/api/errors";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { ImagePicker } from "@/components/admin/image-picker";
import { FacetPicker } from "@/components/admin/facet-picker";
import { Badge } from "@/components/ui/badge";
import type { AdminProduct } from "@/lib/api/types";

export const instant = false;

export const metadata: Metadata = { title: "Товар" };

export default async function EditProductPage({
  params,
}: PageProps<"/admin/catalog/products/[id]">) {
  const { id } = await params;

  let product: AdminProduct;
  try {
    product = await getProduct(id);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) notFound();
    throw error;
  }

  const [{ groups, images, assets }, categories] = await Promise.all([
    getFormOptions(),
    getCategories(),
  ]);
  const selected = product.facetValues.map((link) => link.facetValueId);

  return (
    <>
      <PageHeader
        title={product.title}
        description={product.category.title}
        actions={
          <Badge tone={product.status === "PUBLISHED" ? "ok" : "neutral"}>
            {product.status === "PUBLISHED" ? "На сайте" : "Черновик"}
          </Badge>
        }
      />
      <div className="p-5 lg:p-8">
        <ProductForm
          product={product}
          categories={categories.data.map((item) => ({ id: item.id, title: item.title }))}
          imagePicker={
            <ImagePicker
              images={withCurrentImage(images, product.imageId, product.image)}
              value={product.imageId}
              current={currentImage(assets, product.imageId, product.image)}
            />
          }
          facetPicker={<FacetPicker groups={groups} selected={selected} />}
        />
      </div>
    </>
  );
}
