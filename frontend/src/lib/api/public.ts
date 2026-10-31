import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { apiUrl, searchString } from "./url";
import type {
  Paginated,
  PublicCategory,
  PublicFacetGroup,
  PublicProduct,
  PublicProductDetail,
} from "./types";

/**
 * Каталог для публичного сайта. Берётся из /public/* — того же бэкенда,
 * который правит админка, поэтому опубликованная правка видна на сайте.
 *
 * Токенов тут нет: эндпоинты публичные. Ответы кешируются под одним тегом,
 * а админские действия его сбрасывают (см. lib/admin/catalog-actions.ts),
 * так что сайт не ходит в базу на каждый запрос, но и не отстаёт от админки.
 *
 * Сборка от бэкенда не зависит. Если он доступен во время next build, данные
 * попадают в статическую оболочку и дальше обновляются по тегу. Если нет —
 * блок не запекается пустым (такой не обновился бы до следующей сборки),
 * а становится «дыркой», которую сервер дорисует по первому запросу.
 * Поэтому всё, что читает каталог, стоит под <Suspense>.
 */

export const CATALOG_TAG = "catalog";

/**
 * Ответ бэкенда, разобранный внутри кеша. Кешированная функция не бросает:
 * ошибка изнутри `use cache` на пререндере валит сборку, даже если её
 * поймать снаружи, а наружу выходит обычным Error без своего класса.
 */
type Loaded<T> =
  | { status: "ok"; data: T }
  /** 404 — «такого нет»: ответ, а не сбой, кешируется как обычно. */
  | { status: "missing" }
  | { status: "failed"; message: string };

async function load<T>(path: string): Promise<Loaded<T>> {
  "use cache";
  cacheTag(CATALOG_TAG);
  try {
    const response = await fetch(apiUrl(path), {
      headers: { Accept: "application/json" },
      // Лежащий бэкенд не должен держать рендер до таймаута воркера.
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status === 404) {
      cacheLife("hours");
      return { status: "missing" };
    }
    if (!response.ok) throw new Error(`ответ ${response.status}`);
    const data = (await response.json()) as T;
    cacheLife("hours");
    return { status: "ok", data };
  } catch (error) {
    // Сбой не храним: revalidate 0 — запись не сохраняется, следующий запрос
    // спросит бэкенд снова. На пререндере такая запись — «дырка», которую
    // сервер дорисует по запросу, поэтому пустой каталог не запекается.
    cacheLife({ revalidate: 0, expire: 0 });
    return { status: "failed", message: `${path}: ${String(error)}` };
  }
}

/**
 * Списки при сбое — пустые: без бэкенда страница должна открыться с шапкой,
 * подвалом, телефоном и формой заявки. Ошибка — в лог сервера.
 */
async function list<T>(path: string): Promise<T[]> {
  const result = await load<T[]>(path);
  if (result.status === "ok") return result.data;
  if (result.status === "failed") console.error(`Каталог недоступен — ${result.message}`);
  return [];
}

/**
 * Одна запись: null — «нет такой» (страница ответит 404). Сбой бэкенда,
 * наоборот, уходит в error.tsx: показать «не найдено» на живой товар
 * значило бы сказать поисковику, что страницы больше нет.
 */
async function one<T>(path: string): Promise<T | null> {
  const result = await load<T>(path);
  if (result.status === "ok") return result.data;
  if (result.status === "missing") return null;
  throw new Error(`Каталог недоступен — ${result.message}`);
}

/** Потолок perPage на бэкенде — 100; страницы обходим подряд. */
async function allProducts(categorySlug?: string): Promise<Loaded<PublicProduct[]>> {
  const all: PublicProduct[] = [];
  for (let page = 1; ; page += 1) {
    const chunk = await load<Paginated<PublicProduct>>(
      `/public/products${searchString({ category: categorySlug, page, perPage: 100 })}`,
    );
    if (chunk.status !== "ok") return chunk;
    all.push(...chunk.data.data);
    if (page >= chunk.data.meta.totalPages) return { status: "ok", data: all };
  }
}

/** Опубликованные категории в порядке, заданном в админке. */
export function getCategories(): Promise<PublicCategory[]> {
  return list<PublicCategory>("/public/categories");
}

/** Категория для её страницы; null — нет такой или снята с публикации. */
export function getCategory(slug: string): Promise<PublicCategory | null> {
  return one<PublicCategory>(`/public/categories/${encodeURIComponent(slug)}`);
}

/** Группы фильтров каталога. */
export function getFacetGroups(): Promise<PublicFacetGroup[]> {
  return list<PublicFacetGroup>("/public/facets");
}

/** Опубликованные товары одной категории. */
export async function getCategoryProducts(slug: string): Promise<PublicProduct[]> {
  const result = await allProducts(slug);
  if (result.status === "ok") return result.data;
  if (result.status === "failed") console.error(`Каталог недоступен — ${result.message}`);
  return [];
}

/** Все опубликованные товары — для sitemap. */
export async function getAllProducts(): Promise<PublicProduct[]> {
  const result = await allProducts();
  if (result.status === "ok") return result.data;
  if (result.status === "failed") console.error(`Каталог недоступен — ${result.message}`);
  return [];
}

/** Товар для его страницы; null — нет такого, черновик или категория скрыта. */
export function getProduct(category: string, slug: string): Promise<PublicProductDetail | null> {
  return one<PublicProductDetail>(
    `/public/products/${encodeURIComponent(category)}/${encodeURIComponent(slug)}`,
  );
}

/**
 * Для generateStaticParams. Если бэкенд доступен на сборке, страницы
 * категорий и товаров пререндерятся заранее; если нет — список пуст,
 * и страницы рендерятся по первому запросу.
 */
export async function buildTimeCategorySlugs(): Promise<string[]> {
  const result = await load<PublicCategory[]>("/public/categories");
  return result.status === "ok" ? result.data.map((category) => category.slug) : [];
}

export async function buildTimeProductSlugs(categorySlug: string): Promise<string[]> {
  const result = await allProducts(categorySlug);
  return result.status === "ok" ? result.data.map((product) => product.slug) : [];
}
