"use server";

import { refresh } from "next/cache";
import { apiMutate } from "../api/server";
import { formError, toFormState, type FormState } from "./form-state";
import { nullableInt, optionalText, text } from "./form-values";
import type { AdminFacetValue } from "../api/types";

const FIELDS = ["groupKey", "value", "label", "sortOrder"] as const;

export async function createFacetValue(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const groupKey = text(formData, "groupKey");
  const value = text(formData, "value");
  const label = text(formData, "label");

  const errors: Record<string, string> = {};
  if (groupKey === "") errors.groupKey = "Выберите группу";
  // Значение уходит в query-строку фильтров каталога — отсюда ограничение.
  if (!/^[a-z0-9][a-z0-9+-]*$/.test(value)) {
    errors.value = "Только строчные латинские буквы, цифры, дефис и плюс";
  }
  if (label === "") errors.label = "Укажите, как значение будет подписано";
  if (Object.keys(errors).length > 0) return { status: "error", errors };

  try {
    await apiMutate<AdminFacetValue>("/admin/facets/values", {
      method: "POST",
      json: { groupKey, value, label, sortOrder: nullableInt(formData, "sortOrder") ?? 0 },
    });
  } catch (error) {
    return toFormState(error, FIELDS);
  }

  refresh();
  return { status: "success", errors: {} };
}

export async function updateFacetValue(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = text(formData, "id");
  if (!id) return formError("Не указано значение");

  try {
    // value менять нельзя: он уже в адресах фильтров каталога.
    await apiMutate<AdminFacetValue>(`/admin/facets/values/${id}`, {
      method: "PATCH",
      json: {
        label: optionalText(formData, "label"),
        sortOrder: nullableInt(formData, "sortOrder") ?? 0,
      },
    });
  } catch (error) {
    return toFormState(error, ["label", "sortOrder"]);
  }

  refresh();
  return { status: "success", errors: {} };
}

export async function deleteFacetValue(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = text(formData, "id");
  if (!id) return formError("Не указано значение");

  try {
    await apiMutate<void>(`/admin/facets/values/${id}`, { method: "DELETE" });
  } catch (error) {
    // Используемое значение бэкенд не отдаёт удалить — 409 с числом записей.
    return toFormState(error);
  }

  refresh();
  return { status: "success", errors: {} };
}
