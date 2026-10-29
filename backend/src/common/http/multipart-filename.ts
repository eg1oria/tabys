/**
 * multer/busboy отдают filename из multipart, декодированный как latin1,
 * поэтому «Техзадание.pdf» приходит как «ÐÐµÑ...». Для русскоязычного сайта
 * это важно: имя файла и видит менеджер, и получает в заголовке при скачивании.
 *
 * Перекодируем обратно только если latin1 -> utf8 даёт осмысленный результат;
 * иначе оставляем как есть, чтобы не испортить корректное имя.
 */
export function decodeMultipartFilename(raw: string): string {
  // eslint-disable-next-line no-control-regex
  if (!/[\u0080-ÿ]/.test(raw)) return raw;

  const decoded = Buffer.from(raw, 'latin1').toString('utf8');

  // Признак неудачи — символ замены: значит байты не были UTF-8.
  if (decoded.includes('�')) return raw;

  // Обратная проверка: корректная перекодировка обратима.
  if (Buffer.from(decoded, 'utf8').toString('latin1') !== raw) return raw;

  return decoded;
}
