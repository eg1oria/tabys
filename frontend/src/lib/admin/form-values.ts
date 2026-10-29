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

/** Пусто — null: так бэкенд очищает поле (@IsOptional пропускает null). */
export function nullableText(formData: FormData, name: string): string | null {
  const value = text(formData, name);
  return value === "" ? null : value;
}

export function nullableInt(formData: FormData, name: string): number | null | undefined {
  const value = text(formData, name);
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
}

export function nullableAmount(formData: FormData, name: string): number | null | undefined {
  const value = text(formData, name).replace(",", ".");
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
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

/** Пары «ключ/значение» из редактора характеристик. */
export function pairs(formData: FormData, keyName: string, valueName: string) {
  const keys = formData.getAll(keyName).map((v) => String(v).trim());
  const values = formData.getAll(valueName).map((v) => String(v).trim());
  const result: Record<string, string> = {};
  keys.forEach((key, index) => {
    if (key !== "") result[key] = values[index] ?? "";
  });
  return result;
}

export function omitUndefined<T extends Record<string, unknown>>(input: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}
