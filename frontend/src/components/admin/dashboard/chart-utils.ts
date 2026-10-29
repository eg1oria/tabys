/** Подпись дня для осей: «2026-10-05» → «5 окт». */
const dayFormat = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Almaty",
});

export function dayLabel(isoDay: string): string {
  // Явное смещение: без него «2026-10-05» разберётся как UTC и в Алматы
  // покажет предыдущий день.
  const date = new Date(`${isoDay}T00:00:00+05:00`);
  return Number.isNaN(date.getTime()) ? isoDay : dayFormat.format(date);
}

/** Склонение: 1 заявка, 2 заявки, 5 заявок. */
export function plural(count: number, forms: [string, string, string]): string {
  const mod100 = count % 100;
  const mod10 = count % 10;
  if (mod100 >= 11 && mod100 <= 14) return forms[2];
  if (mod10 === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4) return forms[1];
  return forms[2];
}
