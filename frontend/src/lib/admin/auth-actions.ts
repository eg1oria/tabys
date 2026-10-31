"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { apiUrl } from "../api/url";
import { ApiError, ApiUnreachableError, toApiError } from "../api/errors";
import { apiMutate } from "../api/server";
import { clearTokens, readTokens, writeTokens } from "../api/session";
import { formError, safeNext, toFormState, withValues, type FormState } from "./form-state";
import { collectValues } from "./form-values";
import type { TokenPair } from "../api/types";

export async function login(prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  // Пароль не возвращаем в форму: он осел бы в состоянии клиента.
  const values = collectValues(formData, ["password"]);
  const fail = (state: FormState) => withValues(state, prev, values);

  // Правила зеркалят LoginDto: иначе единственной ошибкой будет 400 от бэкенда.
  // Длину пароля на входе не проверяем — правила действуют при его смене.
  const errors: Record<string, string> = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = "Укажите корректный email";
  if (password.length === 0) errors.password = "Введите пароль";
  if (Object.keys(errors).length > 0) return fail({ status: "error", errors });

  let pair: TokenPair;
  try {
    const response = await fetch(apiUrl("/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await clientHeaders()) },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw await toApiError(response);
    pair = (await response.json()) as TokenPair;
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) {
      return fail(formError("Неверный email или пароль"));
    }
    if (error instanceof ApiError && error.statusCode === 429) {
      // Лимит на IP (5 минут) или блокировка адреса после серии неудач (15).
      return fail(formError("Слишком много попыток входа. Повторите через несколько минут."));
    }
    if (error instanceof ApiUnreachableError) {
      return fail(formError("Сервер админки не отвечает. Проверьте, запущен ли бэкенд."));
    }
    throw error;
  }

  await writeTokens(pair);
  redirect(next);
}

/**
 * Адрес и браузер посетителя для бэкенда. Без них лимит «10 попыток входа
 * на IP» становится общим для всех администраторов: бэкенд видит один адрес
 * сервера Next. Как и в форме заявки, работает только при TRUST_PROXY.
 */
async function clientHeaders(): Promise<Record<string, string>> {
  const incoming = await headers();
  const result: Record<string, string> = {};
  const forwarded = incoming.get("x-forwarded-for") ?? incoming.get("x-real-ip");
  if (forwarded) result["x-forwarded-for"] = forwarded;
  const userAgent = incoming.get("user-agent");
  if (userAgent) result["user-agent"] = userAgent;
  return result;
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
  if (currentPassword.length === 0) errors.currentPassword = "Введите текущий пароль";
  // Остальную политику (повторы, очевидные слова, email) проверяет бэкенд.
  if (newPassword.length < 12) errors.newPassword = "Новый пароль не короче 12 символов";
  if (newPassword !== repeatPassword) errors.repeatPassword = "Пароли не совпадают";
  if (Object.keys(errors).length > 0) return { status: "error", errors };

  let pair: TokenPair;
  try {
    pair = await apiMutate<TokenPair>("/auth/change-password", {
      method: "POST",
      json: { currentPassword, newPassword },
    });
  } catch (error) {
    // 400 здесь — политика нового пароля (password-policy.ts на бэкенде):
    // показываем её под полем, а не общей ошибкой над формой.
    if (error instanceof ApiError && error.statusCode === 400) {
      return { status: "error", errors: { newPassword: error.messages.join(". ") } };
    }
    return toFormState(error, ["currentPassword", "newPassword"]);
  }

  // Бэкенд гасит все refresh-токены, включая наш, и сразу выдаёт новую пару —
  // записываем её, иначе через четверть часа текущая вкладка выпала бы на вход.
  await writeTokens(pair);
  return { status: "success", errors: {} };
}
