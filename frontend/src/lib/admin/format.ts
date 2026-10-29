/**
 * Форматирование для таблиц админки.
 *
 * `new Date(iso)` с аргументом — не синхронный IO, и при cacheComponents
 * вызывать его при рендере можно; запрещён только `new Date()` без
 * аргументов (как и `Date.now()`). Относительное время («2 часа назад»)
 * поэтому и не делаем: ему нужно «сейчас».
 *
 * Часовой пояс задан явно — иначе сервер и браузер покажут разное время.
 */
const dateTime = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Asia/Almaty",
});

const dateOnly = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "long",
  timeZone: "Asia/Almaty",
});

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

export function formatDate(iso: string): string {
  return dateOnly.format(new Date(iso));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

/** Цена приходит строкой (Decimal), число потеряло бы точность. */
export function formatPrice(priceFrom: string | null, onRequest: boolean): string {
  if (onRequest || !priceFrom) return "по запросу";
  const amount = Number(priceFrom);
  if (!Number.isFinite(amount)) return priceFrom;
  return `от ${amount.toLocaleString("ru-RU")} ₸`;
}
