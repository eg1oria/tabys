import "server-only";
import { redirect } from "next/navigation";
import { apiUrl } from "./url";
import { ApiUnreachableError, toApiError } from "./errors";
import { refreshTokens } from "./refresh";
import { clearTokens, readTokens, writeTokens } from "./session";

/**
 * Запросы к админскому API. Всё уходит с сервера Next — в браузере токенов нет.
 *
 * Два входа, потому что контексты разные (см. cookies.md в доках Next):
 *   apiRead   — Server Component: cookie писать нельзя, обновить токен негде;
 *   apiMutate / apiStream — Server Action и Route Handler: cookie писать можно.
 */

type Init = Omit<RequestInit, "body" | "cache"> & {
  /** Тело как JSON. Не указывать вместе с body. */
  json?: unknown;
  body?: BodyInit | null;
};

async function send(path: string, init: Init, token?: string): Promise<Response> {
  const { json, headers, ...rest } = init;
  const merged = new Headers(headers);
  if (token) merged.set("Authorization", `Bearer ${token}`);
  if (json !== undefined) merged.set("Content-Type", "application/json");

  try {
    return await fetch(apiUrl(path), {
      ...rest,
      headers: merged,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
      // Админка не кеширует ничего: редактор должен видеть то, что сохранил.
      cache: "no-store",
      // Лежащий бэкенд не должен держать рендер до таймаута воркера.
      signal: rest.signal ?? AbortSignal.timeout(15_000),
      // Потоковое тело (загрузка файла) без duplex в undici не уходит.
      ...(rest.body instanceof ReadableStream ? { duplex: "half" } : {}),
    } as RequestInit);
  } catch (cause) {
    throw new ApiUnreachableError(cause);
  }
}

async function parse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/**
 * Чтение из Server Component. 401 здесь не лечится: записать обновлённый
 * токен в cookie страница не может, а ротация без записи убила бы сессию —
 * бэкенд считает повторное предъявление отозванного токена утечкой.
 * Обычное истечение перехватывает proxy.ts раньше рендера, так что сюда
 * доходят только отозванный токен и выключенный администратор.
 */
export async function apiRead<T>(path: string, init: Init = {}): Promise<T> {
  const { accessToken } = await readTokens();
  const response = await send(path, init, accessToken);

  if (response.status === 401) redirect("/admin/login?expired=1");
  if (!response.ok) throw await toApiError(response);
  return parse<T>(response);
}

/**
 * Действующий access-токен для Server Action и Route Handler.
 * Отсутствие cookie означает истёкший токен (maxAge равен TTL), поэтому
 * обновляем заранее — и не нужно повторять запрос после 401, что особенно
 * важно для потокового тела: поток уже вычитан, повторить его нельзя.
 */
export async function ensureAccessToken(): Promise<string> {
  const { accessToken, refreshToken } = await readTokens();
  if (accessToken) return accessToken;

  if (!refreshToken) redirect("/admin/login?expired=1");

  try {
    const pair = await refreshTokens(refreshToken);
    await writeTokens(pair);
    return pair.accessToken;
  } catch {
    await clearTokens();
    redirect("/admin/login?expired=1");
  }
}

/** Мутация из Server Action или Route Handler. */
export async function apiMutate<T>(path: string, init: Init = {}): Promise<T> {
  const response = await apiStream(path, init);
  if (!response.ok) throw await toApiError(response);
  return parse<T>(response);
}

/** То же, но без разбора тела — чтобы отдать файл потоком. */
export async function apiStream(path: string, init: Init = {}): Promise<Response> {
  const token = await ensureAccessToken();
  const response = await send(path, init, token);

  if (response.status === 401) {
    await clearTokens();
    redirect("/admin/login?expired=1");
  }
  return response;
}
