/**
 * Телефон из формы заявки → канонический вид.
 *
 * Рядом с полем на сайте нарисовано «+7», но в значение оно не попадает:
 * посетитель вводит «(707) 267-12-37», и раньше это сохранялось как
 * 10 цифр без кода страны. Ссылка tel:+7072671237 в админке звонила не туда,
 * а поиск не находил «+7 707…» по «707…». Здесь же принимаем и привычные
 * записи с восьмёркой и с +7.
 *
 * Правила один в один с frontend/src/lib/phone.ts.
 */
export type NormalizedPhone = {
  /** Только цифры с кодом страны: 77072671237. Для поиска и tel:. */
  digits: string;
  /** Для глаз менеджера: +7 (707) 267-12-37. */
  display: string;
};

export function normalizePhone(input: string): NormalizedPhone | null {
  const raw = input.trim();
  const digits = raw.replace(/\D/g, '');

  // С плюсом — номер уже с кодом страны. +7 — ровно 10 цифр после кода;
  // остальные страны принимаем как есть в пределах длины E.164 (до 15).
  if (raw.startsWith('+')) {
    if (digits.startsWith('7')) return digits.length === 11 ? kz(digits) : null;
    return digits.length >= 8 && digits.length <= 15
      ? { digits, display: `+${digits}` }
      : null;
  }

  // Без плюса — номер Казахстана или России: 10 цифр после «+7»,
  // либо 11 с ведущей 8 (междугородний набор) или 7.
  if (digits.length === 10) return kz(`7${digits}`);
  if (digits.length === 11 && (digits[0] === '8' || digits[0] === '7')) {
    return kz(`7${digits.slice(1)}`);
  }
  return null;
}

function kz(digits: string): NormalizedPhone {
  const d = digits;
  return {
    digits: d,
    display: `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`,
  };
}

/**
 * Цифры для поиска по телефону: «8 707 267…» и «+7 707 267…» должны
 * находить одну и ту же заявку, поэтому 11 цифр с ведущей 8 сводим к 7.
 */
export function phoneSearchDigits(query: string): string {
  const digits = query.replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('8') ? `7${digits.slice(1)}` : digits;
}
