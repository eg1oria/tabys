import "server-only";
import { getFacets } from "../api/catalog";
import { getMedia, thumbUrl } from "../api/media";
import type { PickableImage } from "@/components/admin/image-picker";
import type { AdminFacetGroup, MediaAsset } from "../api/types";

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
export function currentImage(assets: MediaAsset[], imageId: string | null) {
  if (!imageId) return null;
  const asset = assets.find((item) => item.id === imageId);
  return asset ? { thumbUrl: thumbUrl(asset), alt: asset.alt } : null;
}
