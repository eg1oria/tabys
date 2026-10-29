/**
 * Адреса бэкенда. Переменные серверные (без NEXT_PUBLIC_): токены и
 * запросы к API не должны попадать в браузер.
 */

function required(name: "API_URL" | "API_ORIGIN", fallback: string): string {
  const value = process.env[name];
  if (value) return value.replace(/\/+$/, "");
  // В проде молчаливый localhost — это полчаса на поиск причины.
  if (process.env.NODE_ENV === "production") {
    throw new Error(`Не задана переменная окружения ${name} (см. .env.example)`);
  }
  return fallback;
}

export function apiUrl(path: string): string {
  const base = required("API_URL", "http://localhost:4000/api/v1");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Картинки каталога раздаёт бэкенд статикой — url в админских ответах нет. */
export function uploadUrl(storageKey: string): string {
  const origin = required("API_ORIGIN", "http://localhost:4000");
  return `${origin}/uploads/${storageKey}`;
}

/** Query-строка без пустых значений: "?a=1&b=2" или "". */
export function searchString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}
