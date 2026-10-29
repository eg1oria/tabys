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

/** Категорий всего дюжина, и порядок меняется по всему списку сразу. */
export function getCategories(params: { status?: PublishStatus; q?: string } = {}) {
  return apiRead<Paginated<AdminCategory>>(
    `/admin/categories${searchString({ ...params, perPage: 100, sortBy: "sortOrder", order: "asc" })}`,
  );
}

export function getCategory(id: string): Promise<AdminCategory> {
  return apiRead<AdminCategory>(`/admin/categories/${id}`);
}

export function getProducts(params: {
  category?: string;
  status?: PublishStatus;
  q?: string;
  page?: number;
}) {
  return apiRead<Paginated<AdminProduct>>(
    `/admin/products${searchString({ ...params, perPage: 20, sortBy: "sortOrder", order: "asc" })}`,
  );
}

export function getProduct(id: string): Promise<AdminProduct> {
  return apiRead<AdminProduct>(`/admin/products/${id}`);
}

export function getFacets(): Promise<AdminFacetGroup[]> {
  return apiRead<AdminFacetGroup[]>("/admin/facets");
}
