import "server-only";
import { apiRead } from "./server";
import { searchString } from "./url";
import type {
  AdminCategory,
  AdminFacetGroup,
  AdminProduct,
  Paginated,
  PublishStatus,
} from "./types";

/**
 * Все категории сразу, а не страница: порядок меняется по всему списку,
 * и потерянная за потолком perPage (100) категория выпала бы и из
 * таблицы, и из перестановки. Страницы обходим подряд; сейчас их одна.
 */
export async function getCategories(
  params: { status?: PublishStatus; q?: string } = {},
): Promise<Paginated<AdminCategory>> {
  const all: AdminCategory[] = [];
  for (let page = 1; ; page += 1) {
    const chunk = await apiRead<Paginated<AdminCategory>>(
      `/admin/categories${searchString({ ...params, page, perPage: 100, sortBy: "sortOrder", order: "asc" })}`,
    );
    all.push(...chunk.data);
    if (page >= chunk.meta.totalPages) {
      return {
        data: all,
        meta: { page: 1, perPage: all.length, total: chunk.meta.total, totalPages: 1 },
      };
    }
  }
}

export function getCategory(id: string): Promise<AdminCategory> {
  return apiRead<AdminCategory>(`/admin/categories/${id}`);
}

export function getProducts(params: {
  category?: string;
  status?: PublishStatus;
  q?: string;
  page?: number;
  perPage?: number;
  sortBy?: string;
  order?: "asc" | "desc";
}) {
  const { perPage = 20, sortBy = "sortOrder", order = "asc", ...rest } = params;
  return apiRead<Paginated<AdminProduct>>(
    `/admin/products${searchString({ ...rest, perPage, sortBy, order })}`,
  );
}

export function getProduct(id: string): Promise<AdminProduct> {
  return apiRead<AdminProduct>(`/admin/products/${id}`);
}

export function getFacets(): Promise<AdminFacetGroup[]> {
  return apiRead<AdminFacetGroup[]>("/admin/facets");
}
