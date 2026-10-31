/**
 * Чтение полей формы под DTO бэкенда.
 *
 * ValidationPipe настроен с forbidNonWhitelisted: любое лишнее поле — 400.
 * Поэтому необязательные поля именно опускаем, а не отправляем пустыми
 * строками, и собираем тело через `omitUndefined`.
 */
export function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

/** Пустая строка — значит «не задано», поле в тело запроса не попадёт. */
export function optionalText(formData: FormData, name: string): string | undefined {
  const value = text(formData, name);
  return value === "" ? undefined : value;
}

/**
 * Поле, которое можно и очистить: пусто → null (бэкенд пропускает null
 * через @ValidateIf). Поле, которого в форме нет, не трогаем вовсе —
 * иначе частичная форма затирала бы данные, которых не показывала.
 */
export function clearableText(formData: FormData, name: string): string | null | undefined {
  if (!formData.has(name)) return undefined;
  const value = text(formData, name);
  return value === "" ? null : value;
}

/**
 * Собирает отправленные значения, чтобы вернуть их в форму после ошибки.
 * Пароли не возвращаем никогда: они осели бы в состоянии формы.
 */
export function collectValues(
  formData: FormData,
  skip: readonly string[] = [],
): Record<string, string | string[]> {
  const values: Record<string, string | string[]> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string" || skip.includes(key)) continue;
    const existing = values[key];
    if (existing === undefined) values[key] = value;
    else if (Array.isArray(existing)) existing.push(value);
    else values[key] = [existing, value];
  }
  return values;
}

/** Маркер «ввели не число» — отличает ошибку от «поле не заполнено». */
export const NOT_A_NUMBER = Symbol("not-a-number");

/** Пусто — null: так бэкенд очищает поле (@IsOptional пропускает null). */
export function nullableText(formData: FormData, name: string): string | null {
  const value = text(formData, name);
  return value === "" ? null : value;
}

/**
 * «1 500 000», «1 500 000,50» и неразрывные пробелы — обычный ввод цены.
 * Раньше такое значение молча терялось, и форма рапортовала «Сохранено».
 */
function toNumber(raw: string): number | typeof NOT_A_NUMBER | null {
  const value = raw.replace(/[\s\u00a0\u202f]/g, "").replace(",", ".");
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NOT_A_NUMBER;
}

export function nullableInt(
  formData: FormData,
  name: string,
): number | null | typeof NOT_A_NUMBER {
  const parsed = toNumber(text(formData, name));
  return typeof parsed === "number" ? Math.trunc(parsed) : parsed;
}

export function nullableAmount(
  formData: FormData,
  name: string,
): number | null | typeof NOT_A_NUMBER {
  return toNumber(text(formData, name));
}

export function checkbox(formData: FormData, name: string): boolean {
  return formData.get(name) !== null;
}

/** Список из textarea: по одному пункту на строку. */
export function lines(formData: FormData, name: string): string[] {
  return text(formData, name)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function strings(formData: FormData, name: string): string[] {
  return formData.getAll(name).filter((v): v is string => typeof v === "string" && v !== "");
}

/**
 * Пары «ключ/значение» из редактора характеристик — массивом, в порядке
 * строк формы. Объект здесь терял бы порядок (в jsonb) и молча склеивал
 * повторы. Строки без названия пропускаем: это пустые заготовки.
 */
export function pairs(
  formData: FormData,
  keyName: string,
  valueName: string,
): { key: string; value: string }[] {
  const keys = formData.getAll(keyName).map((v) => String(v).trim());
  const values = formData.getAll(valueName).map((v) => String(v).trim());
  return keys.flatMap((key, index) => (key === "" ? [] : [{ key, value: values[index] ?? "" }]));
}

export function omitUndefined<T extends Record<string, unknown>>(input: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}
