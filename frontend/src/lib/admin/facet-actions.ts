"use server";

import { refresh } from "next/cache";
import { apiMutate } from "../api/server";
import { formError, toFormState, withValues, type FormState } from "./form-state";
import { NOT_A_NUMBER, collectValues, nullableInt, optionalText, text } from "./form-values";

/** Порядок — необязательное поле: пусто и мусор одинаково значат «в конец». */
function sortOrder(formData: FormData): number | typeof NOT_A_NUMBER {
  const parsed = nullableInt(formData, "sortOrder");
  return parsed === null ? 0 : parsed;
}
import type { AdminFacetValue } from "../api/types";

const FIELDS = ["groupKey", "value", "label", "sortOrder"] as const;

export async function createFacetValue(
  prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const groupKey = text(formData, "groupKey");
  const value = text(formData, "value");
  const label = text(formData, "label");
  const values = collectValues(formData);
  const fail = (state: FormState) => withValues(state, prev, values);
  const order = sortOrder(formData);

  const errors: Record<string, string> = {};
  if (groupKey === "") errors.groupKey = "Выберите группу";
  // Значение уходит в query-строку фильтров каталога — отсюда ограничение.
  if (!/^[a-z0-9][a-z0-9+-]*$/.test(value)) {
    errors.value = "Только строчные латинские буквы, цифры, дефис и плюс";
  }
  if (label === "") errors.label = "Укажите, как значение будет подписано";
  if (order === NOT_A_NUMBER) errors.sortOrder = "Порядок — целое число";
  if (Object.keys(errors).length > 0) return fail({ status: "error", errors });

  try {
    await apiMutate<AdminFacetValue>("/admin/facets/values", {
      method: "POST",
      json: { groupKey, value, label, sortOrder: order },
    });
  } catch (error) {
    return fail(toFormState(error, FIELDS));
  }

  refresh();
  return { status: "success", errors: {} };
}

export async function updateFacetValue(
  prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = text(formData, "id");
  if (!id) return formError("Не указано значение");
  const values = collectValues(formData);
  const fail = (state: FormState) => withValues(state, prev, values);
  const order = sortOrder(formData);

  if (order === NOT_A_NUMBER) {
    return fail({ status: "error", errors: { sortOrder: "Порядок — целое число" } });
  }

  try {
    // value менять нельзя: он уже в адресах фильтров каталога.
    await apiMutate<AdminFacetValue>(`/admin/facets/values/${id}`, {
      method: "PATCH",
      json: { label: optionalText(formData, "label"), sortOrder: order },
    });
  } catch (error) {
    return fail(toFormState(error, ["label", "sortOrder"]));
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
