/**
 * Адреса страниц каталога — в одном месте, чтобы ссылки из меню, подвала,
 * карточек и sitemap не разъехались. Без server-only: нужны и клиентским
 * компонентам каталога.
 */
export function categoryHref(slug: string): string {
  return `/oborudovanie/${slug}`;
}

export function productHref(categorySlug: string, slug: string): string {
  return `/oborudovanie/${categorySlug}/${slug}`;
}

/**
 * С cacheComponents generateStaticParams обязан вернуть хотя бы один адрес.
 * Когда бэкенда на сборке нет, отдаём этот — слагом он быть не может
 * (там только [a-z0-9-]), и страница сразу отвечает 404.
 */
export const BUILD_PLACEHOLDER = "__build";
