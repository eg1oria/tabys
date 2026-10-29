import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

/** Раскладка по годам/месяцам: листинги остаются обозримыми, бэкап — простым. */
export function datePrefix(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}/${month}`;
}

/**
 * Имя на диске всегда генерируем сами. Оригинальное имя живёт только в базе:
 * иначе «../../etc/passwd», нулевые байты и омоглифы в имени становятся
 * проблемой файловой системы.
 */
export function safeFilename(originalName: string): string {
  const ext = extname(originalName).toLowerCase().slice(0, 10);
  return `${randomUUID()}${/^\.[a-z0-9]+$/.test(ext) ? ext : ''}`;
}

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

/**
 * Собирает абсолютный путь и проверяет, что он не вышел за пределы базы:
 * storageKey приходит из базы, но ломать это обязан именно этот слой.
 */
export function resolveWithin(baseDir: string, relative: string): string {
  const base = resolve(baseDir);
  const target = resolve(join(base, relative));
  if (target !== base && !target.startsWith(base + '/')) {
    throw new Error(`Путь вне каталога загрузок: ${relative}`);
  }
  return target;
}
