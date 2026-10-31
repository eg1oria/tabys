/**
 * Формы ответов админского API. Написаны руками, а не сгенерированы:
 * в проекте три рантайм-зависимости, и кодогенерация стала бы четвёртой.
 *
 * Списано с DTO и констант ADMIN_SELECT в backend/src/modules — при
 * расхождении смотреть туда, а не подгонять здесь. В dev форму ответа
 * можно сверить по http://localhost:4000/api/docs-json.
 */

export type Paginated<T> = {
  data: T[];
  meta: { page: number; perPage: number; total: number; totalPages: number };
};

export type PublishStatus = "DRAFT" | "PUBLISHED";
export type AdminRole = "OWNER" | "EDITOR";
export type LeadStatus = "NEW" | "IN_PROGRESS" | "DONE" | "SPAM";

/** `expiresIn` — секунды (token.service.ts), то есть сразу maxAge для cookie. */
export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export type AdminUserOption = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
};

// ───────────────────────────── заявки ─────────────────────────────

export type LeadAttachment = {
  id: string;
  originalName: string;
  bytes: number;
  mimeType: string;
};

export type Lead = {
  id: string;
  name: string;
  phone: string;
  phoneDigits: string;
  email: string | null;
  message: string | null;
  status: LeadStatus;
  consentAt: string;
  ip: string | null;
  userAgent: string | null;
  internalNote: string | null;
  assignedToId: string | null;
  assignedTo: { id: string; name: string; email: string } | null;
  attachments: LeadAttachment[];
  notifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// ──────────────────── публичный каталог (витрина сайта) ────────────────────

/**
 * Ответы /public/* — то, из чего рендерится сайт. Собираются мапперами
 * backend/src/modules/{categories/categories.mapper.ts,products/products.service.ts}.
 */

/** Картинка из медиатеки: url уже абсолютный, собирать ничего не нужно. */
export type PublicImage = {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  blurDataUrl: string | null;
};

/** Ключ группы фасетов -> значения. Группы и значения задаёт админка. */
export type Facets = Record<string, string[]>;

export type PublicCategory = {
  slug: string;
  title: string;
  /** Короткое имя для боковой панели каталога. */
  short: string;
  description: string;
  /** Витринное число позиций: positionCount, иначе число опубликованных товаров. */
  count: number;
  image: PublicImage | null;
  /** Пункты крупной карточки на главной. */
  highlights: string[];
  /** Названия опубликованных товаров категории. */
  items: string[];
  facets: Facets;
  /** Для <title> и description; пусто — берутся название и описание. */
  seoTitle: string | null;
  seoDescription: string | null;
};

export type PublicProduct = {
  /** Адрес страницы: /oborudovanie/<category.slug>/<slug>. */
  slug: string;
  title: string;
  description: string | null;
  /** По порядку, как задал редактор; пусто — характеристик нет. */
  specs: ProductSpec[];
  /** Decimal сериализуется строкой — число тут потеряло бы точность. */
  priceFrom: string | null;
  priceOnRequest: boolean;
  image: PublicImage | null;
  category: { slug: string; title: string };
  facets: Facets;
};

/** Страница товара: к полям из списка добавляются артикул и галерея. */
export type PublicProductDetail = PublicProduct & {
  sku: string | null;
  /** По порядку, первое — главное фото. Пусто — фото ещё нет. */
  images: PublicImage[];
};

/** Группа фильтров каталога. Пришла на место хардкода filterGroups. */
export type PublicFacetGroup = {
  key: string;
  title: string;
  singleSelect: boolean;
  options: { value: string; label: string }[];
};

// ───────────────────────────── каталог ─────────────────────────────

/** Картинка в админских ответах приходит без url — его собирает uploadUrl(). */
export type AdminImage = {
  storageKey: string;
  alt: string;
  width: number | null;
  height: number | null;
  blurDataUrl: string | null;
};

export type AdminFacetLink = {
  facetValueId: string;
  facetValue: { value: string; group: { key: string } };
};

export type AdminCategory = {
  id: string;
  slug: string;
  title: string;
  short: string;
  description: string;
  highlights: string[];
  positionCount: number | null;
  imageId: string | null;
  image: AdminImage | null;
  seoTitle: string | null;
  seoDescription: string | null;
  facetValues: AdminFacetLink[];
  products: { title: string }[];
  _count: { products: number };
  status: PublishStatus;
  sortOrder: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Характеристика товара. Массив пар, а не объект: так сохраняется порядок. */
export type ProductSpec = { key: string; value: string };

export type AdminProductImage = {
  mediaId: string;
  sortOrder: number;
  media: Pick<AdminImage, "storageKey" | "alt" | "width" | "height"> & {
    derivatives: Record<string, string> | null;
  };
};

export type AdminProduct = {
  id: string;
  categoryId: string;
  /** Обязателен с миграции product_slug_required: из него строится адрес страницы. */
  slug: string;
  sku: string | null;
  title: string;
  description: string | null;
  /** null — характеристики ни разу не задавали. */
  specs: ProductSpec[] | null;
  /** Decimal сериализуется строкой — число тут потеряло бы точность. */
  priceFrom: string | null;
  priceOnRequest: boolean;
  imageId: string | null;
  image: AdminImage | null;
  images: AdminProductImage[];
  category: { slug: string; title: string };
  facetValues: AdminFacetLink[];
  status: PublishStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminFacetValue = {
  id: string;
  groupId: string;
  value: string;
  label: string;
  sortOrder: number;
  _count: { categories: number; products: number };
};

export type AdminFacetGroup = {
  id: string;
  key: string;
  title: string;
  singleSelect: boolean;
  sortOrder: number;
  values: AdminFacetValue[];
};

export type MediaAsset = {
  id: string;
  storageKey: string;
  originalName: string;
  mimeType: string;
  bytes: number;
  width: number | null;
  height: number | null;
  blurDataUrl: string | null;
  /** Ключ — ширина в пикселях, значение — storageKey webp-производной. */
  derivatives: Record<string, string> | null;
  alt: string;
  url: string;
  createdAt: string;
};

export type LeadStatusCounts = Record<LeadStatus, number>;

/** Сводка для главной страницы админки — только то, что реально есть в базе. */
export type AdminStats = {
  range: { from: string; to: string; previousFrom: string };
  leads: { total: number; previousTotal: number; byStatus: LeadStatusCounts };
  series: { date: string; count: number }[];
  catalog: {
    products: { total: number; published: number; draft: number };
    categories: { total: number; published: number };
    media: { total: number; bytes: number };
  };
  topCategories: { id: string; title: string; slug: string; products: number }[];
  latestLeads: Pick<
    Lead,
    "id" | "name" | "email" | "phone" | "message" | "status" | "createdAt"
  >[];
};
