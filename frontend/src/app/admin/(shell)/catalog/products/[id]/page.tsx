import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories, getProduct } from "@/lib/api/catalog";
import { apiRead } from "@/lib/api/server";
import { getFormOptions } from "@/lib/admin/catalog-form-data";
import { productGallery } from "@/lib/admin/product-gallery-data";
import { safeNext } from "@/lib/admin/form-state";
import { textParam } from "@/lib/admin/search-params";
import { ApiError } from "@/lib/api/errors";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { FacetPicker } from "@/components/admin/facet-picker";
import { Badge } from "@/components/ui/badge";
import type { AdminProduct, CurrentUser } from "@/lib/api/types";

export const instant = false;

export const metadata: Metadata = { title: "Товар" };

export default async function EditProductPage({
  params,
  searchParams,
}: PageProps<"/admin/catalog/products/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  // Куда вернуться: список с теми же фильтрами, если пришли оттуда.
  const returnTo = safeNext(textParam(query.returnTo, 300), "/admin/catalog/products");

  let product: AdminProduct;
  try {
    product = await getProduct(id);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) notFound();
    throw error;
  }

  const [{ groups, images }, categories, me] = await Promise.all([
    getFormOptions(),
    getCategories(),
    apiRead<CurrentUser>("/auth/me"),
  ]);

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Каталог" },
          { label: "Все товары", href: returnTo },
          { label: product.title },
        ]}
        title={product.title}
        description={product.category.title}
        actions={
          <Badge tone={product.status === "PUBLISHED" ? "ok" : "neutral"}>
            {product.status === "PUBLISHED" ? "Опубликован" : "Черновик"}
          </Badge>
        }
      />
      <div className="p-5 lg:p-8">
        <ProductForm
          product={product}
          categories={categories.data.map((item) => ({ id: item.id, title: item.title }))}
          gallery={productGallery(product)}
          library={images}
          returnTo={returnTo}
          canDelete={me.role === "OWNER"}
          facetPicker={
            <FacetPicker
              groups={groups}
              selected={product.facetValues.map((link) => link.facetValueId)}
            />
          }
        />
      </div>
    </>
  );
}
