import { notFound } from "next/navigation";
import { getCategories, getProduct } from "@/lib/api/catalog";
import { getFormOptions } from "@/lib/admin/catalog-form-data";
import { uploadUrl } from "@/lib/api/url";
import { ApiError } from "@/lib/api/errors";
import { ProductForm } from "@/components/admin/product-form";
import { FacetPicker } from "@/components/admin/facet-picker";
import { DrawerShell } from "./drawer-shell";
import type { AdminProduct } from "@/lib/api/types";
import type { GalleryItem } from "./product-gallery";

/**
 * Содержимое панели редактирования. Отдельный серверный компонент внутри
 * <Suspense>: таблица товаров показывается сразу, не дожидаясь медиатеки
 * и фасетов.
 */
export async function ProductDrawer({
  id,
  categorySlug,
  returnTo,
}: {
  /** id товара или null для нового. */
  id: string | null;
  categorySlug?: string;
  returnTo: string;
}) {
  let product: AdminProduct | null = null;
  if (id) {
    try {
      product = await getProduct(id);
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) notFound();
      throw error;
    }
  }

  const [{ groups, images }, categories] = await Promise.all([getFormOptions(), getCategories()]);

  // Галерея: сначала связанные картинки, иначе — одно главное фото.
  const gallery: GalleryItem[] = product
    ? // Галерея может не прийти со старой версии бэкенда — тогда одно фото.
      (product.images?.length ?? 0) > 0
      ? product.images.map((item) => ({
          id: item.mediaId,
          thumbUrl: uploadUrl(item.media.derivatives?.["400"] ?? item.media.storageKey),
          alt: item.media.alt,
        }))
      : product.imageId && product.image
        ? [
            {
              id: product.imageId,
              thumbUrl: uploadUrl(product.image.storageKey),
              alt: product.image.alt,
            },
          ]
        : []
    : [];

  const defaultCategoryId = categorySlug
    ? categories.data.find((item) => item.slug === categorySlug)?.id
    : undefined;

  return (
    <DrawerShell
      title={product ? "Редактирование товара" : "Новый товар"}
      closeHref={returnTo}
    >
      <ProductForm
        product={product}
        categories={categories.data.map((item) => ({ id: item.id, title: item.title }))}
        defaultCategoryId={defaultCategoryId}
        gallery={gallery}
        library={images}
        returnTo={returnTo}
        facetPicker={
          <FacetPicker
            groups={groups}
            selected={product?.facetValues.map((link) => link.facetValueId) ?? []}
          />
        }
      />
    </DrawerShell>
  );
}
