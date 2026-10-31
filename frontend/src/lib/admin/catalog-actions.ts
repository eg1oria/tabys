"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { apiMutate } from "../api/server";
import { CATALOG_TAG } from "../api/public";
import { formError, safeNext, toFormState, withValues, type FormState } from "./form-state";
import {
  NOT_A_NUMBER,
  checkbox,
  clearableText,
  optionalText,
  collectValues,
  lines,
  nullableAmount,
  nullableInt,
  nullableText,
  omitUndefined,
  pairs,
  strings,
  text,
} from "./form-values";
import type { AdminCategory, AdminProduct } from "../api/types";

const CATEGORY_FIELDS = ["title", "slug", "short", "description", "positionCount"] as const;
const PRODUCT_FIELDS = ["title", "slug", "sku", "description", "priceFrom", "categoryId"] as const;

/** Куда вернуться после сохранения или удаления: список с теми же фильтрами. */
function returnTo(formData: FormData, fallback: string): string {
  return safeNext(text(formData, "returnTo") || undefined, fallback);
}

// ───────────────────────────── категории ─────────────────────────────

export async function saveCategory(prev: FormState, formData: FormData): Promise<FormState> {
  const id = text(formData, "id");
  const title = text(formData, "title");
  const description = text(formData, "description");
  const values = collectValues(formData);
  const fail = (state: FormState) => withValues(state, prev, values);

  const positionCount = nullableInt(formData, "positionCount");

  const errors: Record<string, string> = {};
  if (title.length < 2) errors.title = "Название не короче двух символов";
  if (description === "") errors.description = "Опишите категорию";
  if (positionCount === NOT_A_NUMBER) errors.positionCount = "Количество — целое число";
  if (Object.keys(errors).length > 0) return fail({ status: "error", errors });

  const body = omitUndefined({
    title,
    description,
    slug: optionalText(formData, "slug"),
    short: optionalText(formData, "short"),
    highlights: lines(formData, "highlights"),
    positionCount,
    imageId: nullableText(formData, "imageId"),
    facetValueIds: strings(formData, "facetValueIds"),
    seoTitle: clearableText(formData, "seoTitle"),
    seoDescription: clearableText(formData, "seoDescription"),
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
    return fail(toFormState(error, CATEGORY_FIELDS));
  }

  // Витрина сайта читает каталог из кеша — сбрасываем его, чтобы правка
  // была видна посетителю сразу, а не через час (cacheLife в lib/api/public.ts).
  updateTag(CATALOG_TAG);

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

  updateTag(CATALOG_TAG);
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

  updateTag(CATALOG_TAG);
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

  updateTag(CATALOG_TAG);
  refresh();
  return { status: "success", errors: {} };
}

// ───────────────────────────── товары ─────────────────────────────

/** Статус из формы: всё неожиданное считаем «не меняем». */
function oneOfStatus(value: string): "DRAFT" | "PUBLISHED" | undefined {
  return value === "DRAFT" || value === "PUBLISHED" ? value : undefined;
}

export async function saveProduct(prev: FormState, formData: FormData): Promise<FormState> {
  const id = text(formData, "id");
  const title = text(formData, "title");
  const categoryId = text(formData, "categoryId");
  const values = collectValues(formData);
  const fail = (state: FormState) => withValues(state, prev, values);

  const priceFrom = nullableAmount(formData, "priceFrom");

  const errors: Record<string, string> = {};
  if (title.length < 2) errors.title = "Название не короче двух символов";
  if (categoryId === "") errors.categoryId = "Выберите категорию";
  if (priceFrom === NOT_A_NUMBER) errors.priceFrom = "Цена — число, например 1 200 000";
  if (Object.keys(errors).length > 0) return fail({ status: "error", errors });

  const specs = pairs(formData, "specKey", "specValue");
  const imageIds = strings(formData, "imageIds");

  const body = omitUndefined({
    categoryId,
    title,
    slug: clearableText(formData, "slug"),
    sku: clearableText(formData, "sku"),
    description: clearableText(formData, "description"),
    // Отправляем всегда, в том числе пустым объектом: иначе однажды
    // заполненные характеристики нельзя было бы стереть через форму.
    specs,
    priceFrom,
    priceOnRequest: checkbox(formData, "priceOnRequest"),
    // Галерея задаёт и главное фото — отправляем её, только если форма
    // её показывала, иначе частичная форма стёрла бы картинки.
    imageIds: formData.has("galleryShown") ? imageIds : undefined,
    imageId: formData.has("galleryShown") ? undefined : nullableText(formData, "imageId"),
    status: oneOfStatus(text(formData, "status")),
    facetValueIds: strings(formData, "facetValueIds"),
    sortOrder: nullableInt(formData, "sortOrder") || undefined,
  });

  let created: AdminProduct | undefined;
  try {
    if (id) {
      await apiMutate<AdminProduct>(`/admin/products/${id}`, { method: "PATCH", json: body });
    } else {
      created = await apiMutate<AdminProduct>("/admin/products", { method: "POST", json: body });
    }
  } catch (error) {
    return fail(toFormState(error, PRODUCT_FIELDS));
  }

  updateTag(CATALOG_TAG);
  // Созданный товар открываем в той же панели — фильтры списка сохраняются.
  if (created) {
    const back = returnTo(formData, "/admin/catalog/products");
    redirect(`${back}${back.includes("?") ? "&" : "?"}edit=${created.id}`);
  }

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

  updateTag(CATALOG_TAG);
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

  updateTag(CATALOG_TAG);
  redirect(returnTo(formData, "/admin/catalog/products"));
}

export async function reorderProducts(_prev: FormState, formData: FormData): Promise<FormState> {
  const items = strings(formData, "order").map((id, index) => ({ id, sortOrder: index }));
  if (items.length === 0) return formError("Нечего упорядочивать");

  try {
    await apiMutate<void>("/admin/products/reorder", { method: "PATCH", json: { items } });
  } catch (error) {
    return toFormState(error);
  }

  updateTag(CATALOG_TAG);
  refresh();
  return { status: "success", errors: {} };
}
