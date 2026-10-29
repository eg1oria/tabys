import "server-only";
import { getFacets } from "../api/catalog";
import { getMedia, thumbUrl } from "../api/media";
import { uploadUrl } from "../api/url";
import type { PickableImage } from "@/components/admin/image-picker";
import type { AdminFacetGroup, AdminImage, MediaAsset } from "../api/types";

/**
 * Данные, нужные обеим формам каталога: медиатека для выбора картинки
 * и фасеты для фильтров. perPage=100 — потолок PaginationDto; если
 * картинок станет больше, в выбор попадут только последние сто.
 */
export async function getFormOptions(): Promise<{
  groups: AdminFacetGroup[];
  images: PickableImage[];
  assets: MediaAsset[];
}> {
  const [groups, media] = await Promise.all([getFacets(), getMedia({ perPage: 100 })]);

  return {
    groups,
    assets: media.data,
    images: media.data.map((asset) => ({
      id: asset.id,
      thumbUrl: thumbUrl(asset),
      alt: asset.alt,
      originalName: asset.originalName,
    })),
  };
}

/** Текущая картинка записи — ищем в той же медиатеке, что и выбор. */
export function currentImage(
  assets: MediaAsset[],
  imageId: string | null,
  fallback?: AdminImage | null,
) {
  if (!imageId) return null;
  const asset = assets.find((item) => item.id === imageId);
  if (asset) return { thumbUrl: thumbUrl(asset), alt: asset.alt };
  return fallback ? { thumbUrl: uploadUrl(fallback.storageKey), alt: fallback.alt } : null;
}

/**
 * Картинка записи может быть старше последней сотни медиатеки. Тогда её
 * нет среди вариантов, ни одна радиокнопка не отмечена — и сохранение
 * формы молча обнуляет картинку. Поэтому добавляем её в список сами.
 */
export function withCurrentImage(
  images: PickableImage[],
  imageId: string | null,
  image: AdminImage | null,
): PickableImage[] {
  if (!imageId || !image || images.some((item) => item.id === imageId)) return images;
  return [
    {
      id: imageId,
      thumbUrl: uploadUrl(image.storageKey),
      alt: image.alt,
      originalName: image.alt || "Текущая картинка",
    },
    ...images,
  ];
}
