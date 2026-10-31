const API = 'https://api.telegram.org';
const TIMEOUT_MS = 10_000;

export type TelegramResponse<T> =
  { ok: true; result: T } | { ok: false; status: number; description: string };

/**
 * Один вызов Bot API через встроенный fetch: нужны лишь несколько POST.
 * telegraf и nestjs-telegraf решают задачу диалоговых ботов — здесь это
 * лишняя зависимость.
 *
 * Сетевую ошибку тоже возвращает значением: вызывающему важно только,
 * дошло или нет. Токен в описание ошибки не попадает — он только в URL.
 */
export async function callTelegram<T>(
  token: string,
  method: string,
  body: Record<string, unknown> = {},
): Promise<TelegramResponse<T>> {
  try {
    const res = await fetch(`${API}/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const payload = (await res.json().catch(() => null)) as {
      ok?: boolean;
      result?: T;
      description?: string;
    } | null;

    if (res.ok && payload?.ok) return { ok: true, result: payload.result as T };
    return {
      ok: false,
      status: res.status,
      description: payload?.description ?? `HTTP ${res.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      description: error instanceof Error ? error.message : String(error),
    };
  }
}

export type TelegramUser = {
  id: number;
  username?: string;
  first_name: string;
};

export type TelegramChatInfo = {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
};

export type TelegramUpdate = {
  update_id: number;
  message?: { text?: string; chat: TelegramChatInfo };
};
