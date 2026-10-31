"use server";

import { refresh } from "next/cache";
import { apiMutate } from "../api/server";
import { ApiError, ApiUnreachableError } from "../api/errors";
import { FORM_ERROR, formError, toFormState, withValues, type FormState } from "./form-state";
import type { TelegramLink, TelegramStatus } from "../api/types";

const BASE = "/admin/notifications/telegram";

export async function setTelegramToken(prev: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get("token") ?? "").trim();
  if (!token) {
    return withValues({ status: "error", errors: { token: "Вставьте токен бота" } }, prev, { token });
  }

  try {
    await apiMutate<TelegramStatus>(`${BASE}/bot`, { method: "PUT", json: { token } });
  } catch (error) {
    // Сообщения бэкенда о токене не начинаются с имени поля — кладём их
    // под поле вручную, а не ошибкой всей формы.
    const state = toFormState(error, ["token"]);
    const message = state.errors.token ?? state.errors[FORM_ERROR];
    return withValues({ status: "error", errors: { token: message } }, prev, { token });
  }

  refresh();
  return { status: "success", errors: {} };
}

export async function removeTelegramBot(): Promise<FormState> {
  try {
    await apiMutate<void>(`${BASE}/bot`, { method: "DELETE" });
  } catch (error) {
    return toFormState(error);
  }
  refresh();
  return { status: "success", errors: {} };
}

export async function removeTelegramChat(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return formError("Не указан чат");

  try {
    await apiMutate<void>(`${BASE}/chats/${id}`, { method: "DELETE" });
  } catch (error) {
    return toFormState(error);
  }
  refresh();
  return { status: "success", errors: {} };
}

export async function sendTelegramTest(): Promise<FormState> {
  try {
    const { delivered } = await apiMutate<{ delivered: boolean }>(`${BASE}/test`, {
      method: "POST",
    });
    // Отказы Telegram записаны у чатов — страница покажет, кому не дошло.
    refresh();
    return delivered
      ? { status: "success", errors: {} }
      : formError("Telegram не принял сообщение ни в один чат — причина указана у чатов ниже.");
  } catch (error) {
    return toFormState(error);
  }
}

type ActionError = { error: string };

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.messages.join(". ");
  if (error instanceof ApiUnreachableError) return "Сервер админки не отвечает";
  throw error;
}

/** Не форма: ссылку админка получает по кнопке и сразу показывает её. */
export async function createTelegramLink(): Promise<TelegramLink | ActionError> {
  try {
    return await apiMutate<TelegramLink>(`${BASE}/link`, { method: "POST" });
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

/**
 * Опрос «нажали ли Start». Список чатов обновляет клиент через
 * router.refresh(): действие вызывается из таймера, а не из формы.
 */
export async function checkTelegramLink(
  code: string,
): Promise<{ connected: boolean; expired: boolean } | ActionError> {
  try {
    return await apiMutate<{ connected: boolean; expired: boolean }>(
      `${BASE}/link/${encodeURIComponent(code)}/check`,
      { method: "POST" },
    );
  } catch (error) {
    return { error: errorMessage(error) };
  }
}
