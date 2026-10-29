/**
 * Карта снята с уже существующих слагов каталога, а не взята из библиотеки:
 * там ц→ts и х→kh, а в проекте pasterizacionnoe и ohladiteli. Промахнуться
 * здесь — значит развести автогенерацию с тем, что уже лежит в URL.
 */
const CYRILLIC: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh',
  з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c',
  ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu',
  я: 'ya',
  // Казахские буквы — компания казахстанская, названия могут их содержать.
  ә: 'a', ғ: 'g', қ: 'q', ң: 'ng', ө: 'o', ұ: 'u', ү: 'u', һ: 'h', і: 'i',
};

export function transliterate(input: string): string {
  return input
    .toLowerCase()
    .replace(/[Ѐ-ӿ]/g, (char) => CYRILLIC[char] ?? '');
}

export function slugify(input: string): string {
  return transliterate(input)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
}

/**
 * Подбирает свободный слаг. Проверка «есть такой?» заведомо racy, поэтому
 * настоящая защита — @unique в схеме и маппинг P2002 в 409; здесь мы лишь
 * избавляем админа от ручного переименования в обычном случае.
 */
export async function uniqueSlug(
  base: string,
  taken: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base) || 'item';
  for (let n = 1; n < 100; n += 1) {
    const candidate = n === 1 ? root : `${root}-${n}`;
    if (!(await taken(candidate))) return candidate;
  }
  return `${root}-${Date.now()}`;
}
