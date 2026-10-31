import "server-only";
import { apiUrl } from "./url";
import { ApiUnreachableError, toApiError } from "./errors";
import type { TokenPair } from "./types";

/**
 * Обновление токена — single-flight в пределах процесса.
 *
 * При включённом partialPrefetching параллельные запросы к /admin/*
 * гарантированы: две вкладки или префетч ссылок легко дают несколько
 * обновлений с одной и той же строкой. Карта ниже сводит их к одному
 * запросу к бэкенду.
 *
 * Корректность на ней не держится: карта живёт в одном процессе, а
 * экземпляров Next может быть несколько. Гонку разрешает бэкенд — повтор
 * того же токена в первые 30 секунд после ротации получает ту же пару,
 * а не гасит семейство (льготное окно в backend/src/auth/token.service.ts).
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
