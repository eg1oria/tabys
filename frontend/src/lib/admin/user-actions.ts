"use server";

import { refresh } from "next/cache";
import { apiMutate } from "../api/server";
import { ApiError } from "../api/errors";
import { formError, toFormState, withValues, type FormState } from "./form-state";
import { collectValues } from "./form-values";
import type { AdminAccount, AdminRole } from "../api/types";

/**
 * Временный пароль бэкенд отдаёт ровно один раз — в ответе на создание
 * или сброс. Он живёт только в состоянии формы, пока страница открыта.
 */
export type PasswordState = FormState & { password?: string; email?: string };

const ROLES: readonly AdminRole[] = ["OWNER", "EDITOR"];

export async function createAdminUser(
  prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "") as AdminRole;
  const fail = (state: FormState) => withValues(state, prev, collectValues(formData));

  // Правила зеркалят CreateUserDto.
  const errors: Record<string, string> = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = "Укажите корректный email";
  if (!name) errors.name = "Укажите имя";
  if (!ROLES.includes(role)) errors.role = "Выберите роль";
  if (Object.keys(errors).length > 0) return fail({ status: "error", errors });

  let result: { user: AdminAccount; password: string };
  try {
    result = await apiMutate(`/admin/users`, { method: "POST", json: { email, name, role } });
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 409) {
      return fail({ status: "error", errors: { email: error.messages.join(". ") } });
    }
    return fail(toFormState(error));
  }

  refresh();
  return {
    status: "success",
    errors: {},
    password: result.password,
    email: result.user.email,
    submissionId: (prev.submissionId ?? 0) + 1,
  };
}

/** Одно изменение за раз: роль или доступ — кнопкой в меню строки. */
export async function updateAdminUser(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return formError("Не указан администратор");

  const json: { role?: AdminRole; isActive?: boolean } = {};
  const role = formData.get("role");
  if (typeof role === "string" && ROLES.includes(role as AdminRole)) json.role = role as AdminRole;
  const isActive = formData.get("isActive");
  if (isActive === "true" || isActive === "false") json.isActive = isActive === "true";
  if (Object.keys(json).length === 0) return formError("Нечего менять");

  try {
    await apiMutate(`/admin/users/${encodeURIComponent(id)}`, { method: "PATCH", json });
  } catch (error) {
    return toFormState(error);
  }
  refresh();
  return { status: "success", errors: {} };
}

export async function resetAdminPassword(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return formError("Не указан администратор");

  try {
    const { password } = await apiMutate<{ password: string }>(
      `/admin/users/${encodeURIComponent(id)}/reset-password`,
      { method: "POST" },
    );
    return { status: "success", errors: {}, password };
  } catch (error) {
    return toFormState(error);
  }
}
