/**
 * Телефон из формы заявки → номер с кодом страны. Правила один в один
 * с backend/src/common/phone/phone.ts (там же — почему это нужно и тесты).
 *
 * «+7» рядом с полем — подпись, в значение оно не попадает: посетитель
 * вводит «(707) 267-12-37», а здесь это становится 77072671237.
 */
export function phoneDigits(input: string): string | null {
  const raw = input.trim();
  const digits = raw.replace(/\D/g, "");

  if (raw.startsWith("+")) {
    if (digits.startsWith("7")) return digits.length === 11 ? digits : null;
    return digits.length >= 8 && digits.length <= 15 ? digits : null;
  }
  if (digits.length === 10) return `7${digits}`;
  if (digits.length === 11 && (digits[0] === "8" || digits[0] === "7")) {
    return `7${digits.slice(1)}`;
  }
  return null;
}
