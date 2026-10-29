import "server-only";
import { uploadUrl } from "../api/url";
import type { GalleryItem } from "@/components/admin/catalog/product-gallery";
import type { AdminProduct } from "../api/types";

/**
 * Галерея товара для формы. Если связанных картинок нет — показываем
 * единственное главное фото: так выглядят товары, заведённые до галереи.
 */
export function productGallery(product: AdminProduct): GalleryItem[] {
  if (product.images?.length) {
    return product.images.map((item) => ({
      id: item.mediaId,
      thumbUrl: uploadUrl(item.media.derivatives?.["400"] ?? item.media.storageKey),
      alt: item.media.alt,
    }));
  }

  if (product.imageId && product.image) {
    return [
      {
        id: product.imageId,
        thumbUrl: uploadUrl(product.image.storageKey),
        alt: product.image.alt,
      },
    ];
  }

  return [];
}
