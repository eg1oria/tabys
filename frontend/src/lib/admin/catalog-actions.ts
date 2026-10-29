"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { apiMutate } from "../api/server";
import { formError, toFormState, type FormState } from "./form-state";
import {
  checkbox,
  lines,
  nullableAmount,
  nullableInt,
  nullableText,
  omitUndefined,
  optionalText,
  pairs,
  strings,
  text,
} from "./form-values";
import type { AdminCategory, AdminProduct } from "../api/types";

const CATEGORY_FIELDS = ["title", "slug", "short", "description", "positionCount"] as const;
const PRODUCT_FIELDS = ["title", "slug", "description", "priceFrom", "categoryId"] as const;

// ───────────────────────────── категории ─────────────────────────────

export async function saveCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = text(formData, "id");
  const title = text(formData, "title");
  const description = text(formData, "description");

  const errors: Record<string, string> = {};
  if (title.length < 2) errors.title = "Название не короче двух символов";
  if (description === "") errors.description = "Опишите категорию";
  if (Object.keys(errors).length > 0) return { status: "error", errors };

  const body = omitUndefined({
    title,
    description,
    slug: optionalText(formData, "slug"),
    short: optionalText(formData, "short"),
    highlights: lines(formData, "highlights"),
    positionCount: nullableInt(formData, "positionCount"),
    imageId: nullableText(formData, "imageId"),
    facetValueIds: strings(formData, "facetValueIds"),
    seoTitle: optionalText(formData, "seoTitle"),
    seoDescription: optionalText(formData, "seoDescription"),
  });

  let created: AdminCategory | undefined;
  try {
    if (id) {
      await apiMutate<AdminCategory>(`/admin/categories/${id}`, { method: "PATCH", json: body });
    } else {
      created = await apiMutate<AdminCategory>("/admin/categories", {
        method: "POST",
        json: body,
      });
    }
  } catch (error) {
    return toFormState(error, CATEGORY_FIELDS);
  }

  // redirect бросает исключение — вызывать его внутри try нельзя,
  // иначе его перехватит catch выше и покажет как ошибку формы.
  if (created) redirect(`/admin/catalog/categories/${created.id}`);

  refresh();
  return { status: "success", errors: {} };
}

export async function setCategoryStatus(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = text(formData, "id");
  const action = text(formData, "action");
  if (!id) return formError("Не указана категория");

  try {
    await apiMutate<AdminCategory>(
      `/admin/categories/${id}/${action === "publish" ? "publish" : "unpublish"}`,
      { method: "PATCH" },
    );
  } catch (error) {
    return toFormState(error);
  }

  refresh();
  return { status: "success", errors: {} };
}

export async function deleteCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = text(formData, "id");
  if (!id) return formError("Не указана категория");

  try {
    await apiMutate<void>(`/admin/categories/${id}`, { method: "DELETE" });
  } catch (error) {
    // Удалять категории может только OWNER — 403 придёт сюда с пояснением.
    return toFormState(error);
  }

  redirect("/admin/catalog/categories");
}

export async function reorderCategories(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const items = strings(formData, "order").map((id, index) => ({ id, sortOrder: index }));
  if (items.length === 0) return formError("Нечего упорядочивать");

  try {
    // Весь список одним запросом: бэкенд применяет его одной транзакцией.
    await apiMutate<void>("/admin/categories/reorder", { method: "PATCH", json: { items } });
  } catch (error) {
    return toFormState(error);
  }

  refresh();
  return { status: "success", errors: {} };
}

// ───────────────────────────── товары ─────────────────────────────

export async function saveProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = text(formData, "id");
  const title = text(formData, "title");
  const categoryId = text(formData, "categoryId");

  const errors: Record<string, string> = {};
  if (title.length < 2) errors.title = "Название не короче двух символов";
  if (categoryId === "") errors.categoryId = "Выберите категорию";
  if (Object.keys(errors).length > 0) return { status: "error", errors };

  const specs = pairs(formData, "specKey", "specValue");

  const body = omitUndefined({
    categoryId,
    title,
    slug: optionalText(formData, "slug"),
    description: optionalText(formData, "description"),
    // Отправляем всегда, в том числе пустым объектом: иначе однажды
    // заполненные характеристики нельзя было бы стереть через форму.
    specs,
    priceFrom: nullableAmount(formData, "priceFrom"),
    priceOnRequest: checkbox(formData, "priceOnRequest"),
    imageId: nullableText(formData, "imageId"),
    facetValueIds: strings(formData, "facetValueIds"),
    sortOrder: nullableInt(formData, "sortOrder") ?? undefined,
  });

  let created: AdminProduct | undefined;
  try {
    if (id) {
      await apiMutate<AdminProduct>(`/admin/products/${id}`, { method: "PATCH", json: body });
    } else {
      created = await apiMutate<AdminProduct>("/admin/products", { method: "POST", json: body });
    }
  } catch (error) {
    return toFormState(error, PRODUCT_FIELDS);
  }

  if (created) redirect(`/admin/catalog/products/${created.id}`);

  refresh();
  return { status: "success", errors: {} };
}

export async function setProductStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = text(formData, "id");
  const action = text(formData, "action");
  if (!id) return formError("Не указан товар");

  try {
    await apiMutate<AdminProduct>(
      `/admin/products/${id}/${action === "publish" ? "publish" : "unpublish"}`,
      { method: "PATCH" },
    );
  } catch (error) {
    return toFormState(error);
  }

  refresh();
  return { status: "success", errors: {} };
}

export async function deleteProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = text(formData, "id");
  if (!id) return formError("Не указан товар");

  try {
    await apiMutate<void>(`/admin/products/${id}`, { method: "DELETE" });
  } catch (error) {
    return toFormState(error);
  }

  redirect("/admin/catalog/products");
}

export async function reorderProducts(_prev: FormState, formData: FormData): Promise<FormState> {
  const items = strings(formData, "order").map((id, index) => ({ id, sortOrder: index }));
  if (items.length === 0) return formError("Нечего упорядочивать");

  try {
    await apiMutate<void>("/admin/products/reorder", { method: "PATCH", json: { items } });
  } catch (error) {
    return toFormState(error);
  }

  refresh();
  return { status: "success", errors: {} };
}
