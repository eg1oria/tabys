/**
 * sortBy приходит из query и в Prisma напрямую попадать не должен:
 * произвольный ключ уводит orderBy в обход связей и даёт 500.
 * Разрешённый список на каждый ресурс свой.
 *
 * Вторым ключом всегда id: при равных sortOrder (новые записи, ручная
 * перестановка) Postgres волен отдавать строки в любом порядке, и при
 * обходе страниц одна строка попала бы на две страницы, а другая — ни на одну.
 */
export function buildOrderBy<T extends string>(
  sortBy: string | undefined,
  order: 'asc' | 'desc',
  allowed: readonly T[],
  fallback: Record<string, 'asc' | 'desc'>,
): Record<string, 'asc' | 'desc'>[] {
  const primary =
    sortBy && (allowed as readonly string[]).includes(sortBy) ? { [sortBy]: order } : fallback;
  return [primary, { id: 'asc' }];
}
