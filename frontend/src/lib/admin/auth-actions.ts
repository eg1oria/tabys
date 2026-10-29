"use server";

import { redirect } from "next/navigation";
import { apiUrl } from "../api/url";
import { ApiError, ApiUnreachableError, toApiError } from "../api/errors";
import { apiMutate } from "../api/server";
import { clearTokens, readTokens, writeTokens } from "../api/session";
import { formError, safeNext, toFormState, type FormState } from "./form-state";
import type { TokenPair } from "../api/types";

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  // Правила зеркалят LoginDto: иначе единственной ошибкой будет 400 от бэкенда.
  const errors: Record<string, string> = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = "Укажите корректный email";
  if (password.length < 8) errors.password = "Пароль не короче 8 символов";
  if (Object.keys(errors).length > 0) return { status: "error", errors };

  let pair: TokenPair;
  try {
    const response = await fetch(apiUrl("/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw await toApiError(response);
    pair = (await response.json()) as TokenPair;
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) {
      return formError("Неверный email или пароль");
    }
    if (error instanceof ApiError && error.statusCode === 429) {
      return formError("Слишком много попыток входа. Повторите через несколько минут.");
    }
    if (error instanceof ApiUnreachableError) {
      return formError("Сервер админки не отвечает. Проверьте, запущен ли бэкенд.");
    }
    throw error;
  }

  await writeTokens(pair);
  redirect(next);
}

export async function logout(): Promise<void> {
  const { refreshToken } = await readTokens();

  if (refreshToken) {
    // Бэкенд гасит всё семейство токенов. Его недоступность не должна
    // запирать администратора в интерфейсе — cookie чистим в любом случае.
    try {
      await fetch(apiUrl("/auth/logout"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      });
    } catch {
      // Молчим осознанно: результат выхода определяется очисткой cookie.
    }
  }

  await clearTokens();
  redirect("/admin/login");
}

export async function changePassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const repeatPassword = String(formData.get("repeatPassword") ?? "");

  const errors: Record<string, string> = {};
  if (currentPassword.length < 8) errors.currentPassword = "Введите текущий пароль";
  if (newPassword.length < 12) errors.newPassword = "Новый пароль не короче 12 символов";
  if (newPassword !== repeatPassword) errors.repeatPassword = "Пароли не совпадают";
  if (Object.keys(errors).length > 0) return { status: "error", errors };

  try {
    await apiMutate<void>("/auth/change-password", {
      method: "POST",
      json: { currentPassword, newPassword },
    });
  } catch (error) {
    return toFormState(error, ["currentPassword", "newPassword"]);
  }

  // Бэкенд завершает остальные сессии, текущая остаётся живой.
  return { status: "success", errors: {} };
}
