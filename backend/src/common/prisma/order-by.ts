/**
 * sortBy приходит из query и в Prisma напрямую попадать не должен:
 * произвольный ключ уводит orderBy в обход связей и даёт 500.
 * Разрешённый список на каждый ресурс свой.
 */
export function buildOrderBy<T extends string>(
  sortBy: string | undefined,
  order: 'asc' | 'desc',
  allowed: readonly T[],
  fallback: Record<string, 'asc' | 'desc'>,
): Record<string, 'asc' | 'desc'> {
  return sortBy && (allowed as readonly string[]).includes(sortBy)
    ? { [sortBy]: order }
    : fallback;
}
