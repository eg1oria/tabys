import "server-only";
import { apiUrl } from "./url";
import { ApiUnreachableError, toApiError } from "./errors";
import type { TokenPair } from "./types";

/**
 * Обновление токена — строго single-flight.
 *
 * Бэкенд считает повторное предъявление уже отозванного refresh-токена
 * признаком утечки и гасит всё семейство (backend/src/auth/token.service.ts).
 * А при включённом partialPrefetching параллельные запросы к /admin/*
 * гарантированы: двe вкладки или префетч ссылок легко дают два обновления
 * с одной и той же строкой. Без общего обещания второй запрос предъявит
 * уже отозванный токен и выбросит администратора из всех сессий.
 *
 * Поэтому карту ниже удалять нельзя — она тут не ради экономии запроса.
 */
const inFlight = new Map<string, Promise<TokenPair>>();

export function refreshTokens(refreshToken: string): Promise<TokenPair> {
  const existing = inFlight.get(refreshToken);
  if (existing) return existing;

  const started = rotate(refreshToken).finally(() => {
    inFlight.delete(refreshToken);
  });
  inFlight.set(refreshToken, started);
  return started;
}

async function rotate(refreshToken: string): Promise<TokenPair> {
  let response: Response;
  try {
    response = await fetch(apiUrl("/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
      // Без таймаута зависший бэкенд держит рендер страницы до воркера.
      signal: AbortSignal.timeout(10_000),
    });
  } catch (cause) {
    throw new ApiUnreachableError(cause);
  }

  if (!response.ok) throw await toApiError(response);
  return (await response.json()) as TokenPair;
}
