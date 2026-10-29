import "server-only";
import { apiRead } from "./server";
import { searchString, uploadUrl } from "./url";
import type { MediaAsset, Paginated } from "./types";

export function getMedia(params: { page?: number; perPage?: number } = {}): Promise<
  Paginated<MediaAsset>
> {
  return apiRead<Paginated<MediaAsset>>(
    `/admin/media${searchString({ page: params.page, perPage: params.perPage ?? 24 })}`,
  );
}

/**
 * Миниатюра для админки: бэкенд при загрузке делает webp-производные
 * на 400/800/1600. Оригинал может весить 10 МБ, поэтому в сетку он
 * не годится; если производной нет (картинка уже меньше 400px) —
 * оригинал и так лёгкий.
 */
export function thumbUrl(asset: MediaAsset): string {
  const derivative = asset.derivatives?.["400"];
  return derivative ? uploadUrl(derivative) : asset.url;
}
