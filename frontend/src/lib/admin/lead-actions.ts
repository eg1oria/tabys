"use server";

import { refresh } from "next/cache";
import { apiMutate } from "../api/server";
import { isLeadStatus } from "./lead-status";
import { formError, toFormState, withValues, type FormState } from "./form-state";
import { collectValues } from "./form-values";
import type { CurrentUser, Lead } from "../api/types";

/**
 * Изменение статуса. В форме несколько кнопок submit с одним именем
 * status — так один useActionState обслуживает все переходы и ошибка
 * показывается на месте.
 */
export async function updateLeadStatus(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const status = formData.get("status");

  if (!id) return formError("Не указана заявка");
  if (!isLeadStatus(status)) return formError("Неизвестный статус");

  try {
    await apiMutate<Lead>(`/admin/leads/${id}`, { method: "PATCH", json: { status } });
  } catch (error) {
    return toFormState(error);
  }

  // Данные админки не кешируются, но клиентский роутер держит готовый
  // RSC-ответ: без refresh() страница осталась бы со старым статусом.
  refresh();
  return { status: "success", errors: {} };
}

export async function saveInternalNote(
  prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const internalNote = String(formData.get("internalNote") ?? "");
  const values = collectValues(formData);

  if (!id) return formError("Не указана заявка");
  if (internalNote.length > 5000) {
    return withValues(
      { status: "error", errors: { internalNote: "Заметка не длиннее 5000 символов" } },
      prev,
      values,
    );
  }

  try {
    await apiMutate<Lead>(`/admin/leads/${id}`, {
      method: "PATCH",
      // Пустую заметку отправляем пустой строкой: null в DTO не принимается,
      // а forbidNonWhitelisted не даст просто опустить поле иначе.
      json: { internalNote },
    });
  } catch (error) {
    return withValues(toFormState(error, ["internalNote"]), prev, values);
  }

  refresh();
  return { status: "success", errors: {} };
}

export async function assignLead(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const raw = String(formData.get("assignedToId") ?? "");

  if (!id) return formError("Не указана заявка");

  // "me" — чтобы форма не держала в разметке чужой идентификатор.
  let assignedToId: string | null = null;
  if (raw === "me") {
    // Именно apiMutate: apiRead не умеет обновлять токен из действия и
    // на истёкшем access-cookie увёл бы редактора на страницу входа.
    const me = await apiMutate<CurrentUser>("/auth/me");
    assignedToId = me.id;
  } else if (raw !== "") {
    assignedToId = raw;
  }

  try {
    await apiMutate<Lead>(`/admin/leads/${id}`, { method: "PATCH", json: { assignedToId } });
  } catch (error) {
    return toFormState(error);
  }

  refresh();
  return { status: "success", errors: {} };
}
