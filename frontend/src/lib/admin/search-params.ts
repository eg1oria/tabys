/**
 * Разбор ?query для списков админки.
 *
 * Параметры приходят из адресной строки и могут быть любыми: бэкенд на
 * `page=1.5` отвечает 400, а на `q` длиннее 100 символов — тоже 400, и
 * страница падает в error boundary. Поэтому чиним значения здесь, а не
 * надеемся на аккуратность ссылок.
 */

const MAX_Q = 100;

type Param = string | string[] | undefined;

function single(value: Param): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

/** Номер страницы: целое ≥ 2, иначе первая (её в адресе не держим). */
export function pageParam(value: Param): number | undefined {
  const raw = single(value);
  if (raw === undefined) return undefined;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 2) return undefined;
  return Math.min(parsed, 10_000);
}

export function qParam(value: Param): string | undefined {
  const raw = single(value)?.trim();
  if (!raw) return undefined;
  return raw.slice(0, MAX_Q);
}

/** Значение из белого списка — всё остальное считаем не заданным. */
export function oneOf<T extends string>(value: Param, allowed: readonly T[]): T | undefined {
  const raw = single(value);
  return allowed.includes(raw as T) ? (raw as T) : undefined;
}

export function textParam(value: Param, maxLength = MAX_Q): string | undefined {
  const raw = single(value)?.trim();
  if (!raw) return undefined;
  return raw.slice(0, maxLength);
}

/** "title:asc" → {sortBy, order}; поле обязано быть в белом списке. */
export function sortParam<T extends string>(
  value: Param,
  allowed: readonly T[],
): { sortBy?: T; order?: "asc" | "desc" } {
  const raw = single(value);
  if (!raw) return {};
  const [field, direction] = raw.split(":");
  if (!allowed.includes(field as T)) return {};
  return { sortBy: field as T, order: direction === "desc" ? "desc" : "asc" };
}
