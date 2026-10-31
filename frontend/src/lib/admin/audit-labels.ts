/**
 * Журнал действий по-русски. Коды действий и сущностей — те, что пишет
 * бэкенд (AuditService.log); незнакомый код показываем как есть, а не
 * прячем: новая запись в журнале не должна пропасть из-за подписи.
 */

export const AUDIT_ENTITY_LABEL: Record<string, string> = {
  Category: "Категории",
  Product: "Товары",
  FacetValue: "Параметры",
  MediaAsset: "Файлы",
  Lead: "Заявки",
  AdminUser: "Администраторы",
  TelegramBot: "Бот Telegram",
  TelegramChat: "Чаты Telegram",
};

export const AUDIT_ENTITIES = Object.keys(AUDIT_ENTITY_LABEL);

const ACTION_LABEL: Record<string, string> = {
  "category.create": "создал категорию",
  "category.update": "изменил категорию",
  "category.publish": "опубликовал категорию",
  "category.unpublish": "снял категорию с публикации",
  "category.reorder": "переставил категории",
  "category.delete": "удалил категорию",
  "product.create": "создал товар",
  "product.update": "изменил товар",
  "product.publish": "опубликовал товар",
  "product.unpublish": "снял товар с публикации",
  "product.reorder": "переставил товары",
  "product.delete": "удалил товар",
  "facetValue.create": "добавил значение параметра",
  "facetValue.update": "изменил значение параметра",
  "facetValue.delete": "удалил значение параметра",
  "media.upload": "загрузил файл",
  "media.update": "изменил подпись к файлу",
  "media.delete": "удалил файл",
  "lead.update": "изменил заявку",
  "user.create": "завёл администратора",
  "user.update": "изменил администратора",
  "user.password.reset": "сбросил пароль администратору",
  "telegram.bot.set": "подключил бота Telegram",
  "telegram.bot.remove": "отключил бота Telegram",
  "telegram.chat.add": "подключил чат Telegram",
  "telegram.chat.remove": "отключил чат Telegram",
};

export function actionLabel(action: string): string {
  return ACTION_LABEL[action] ?? action;
}

export function isDestructive(action: string): boolean {
  return action.endsWith(".delete") || action.endsWith(".remove");
}

/** Куда вести из журнала. У удалённого — некуда; у файлов и людей своих страниц нет. */
export function entityHref(
  entity: string,
  id: string | null,
  action: string,
): string | null {
  if (!id || action.endsWith(".delete")) return null;
  if (entity === "Category") return `/admin/catalog/categories/${id}`;
  if (entity === "Product") return `/admin/catalog/products/${id}`;
  if (entity === "Lead") return `/admin/leads/${id}`;
  return null;
}

type Snapshot = Record<string, unknown>;

function asSnapshot(value: unknown): Snapshot | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Snapshot)
    : null;
}

/** Чем запись называется для человека: название, имя, файл. */
export function entityTitle(before: unknown, after: unknown): string | null {
  for (const snapshot of [asSnapshot(after), asSnapshot(before)]) {
    if (!snapshot) continue;
    for (const key of [
      "title",
      "name",
      "originalName",
      "username",
      "email",
      "value",
    ]) {
      const value = snapshot[key];
      if (typeof value === "string" && value) return value;
    }
  }
  return null;
}

const FIELD_LABEL: Record<string, string> = {
  title: "название",
  short: "краткое название",
  slug: "адрес",
  description: "описание",
  status: "статус",
  sku: "артикул",
  priceFrom: "цена от",
  priceOnRequest: "цена по запросу",
  positionCount: "число позиций",
  highlights: "преимущества",
  specs: "характеристики",
  seoTitle: "SEO-заголовок",
  seoDescription: "SEO-описание",
  sortOrder: "порядок",
  categoryId: "категория",
  imageId: "главное фото",
  images: "галерея",
  facetValues: "параметры",
  alt: "подпись",
  name: "имя",
  email: "email",
  role: "роль",
  isActive: "вход разрешён",
  assignedToId: "ответственный",
  username: "бот",
  chatsKept: "чаты сохранены",
  order: "порядок",
  value: "значение",
};

/** Служебное и производное: в журнале только шум. */
const IGNORED = new Set([
  "id",
  "createdAt",
  "updatedAt",
  "publishedAt",
  "lastLoginAt",
  "_count",
  "category",
  "image",
  "blurDataUrl",
  "derivatives",
  "storageKey",
  "uploadedById",
]);

const VALUE_LABEL: Record<string, string> = {
  PUBLISHED: "опубликовано",
  DRAFT: "черновик",
  OWNER: "владелец",
  EDITOR: "редактор",
  NEW: "новая",
  IN_PROGRESS: "в работе",
  DONE: "закрыта",
  SPAM: "спам",
};

const MAX_VALUE = 80;

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "да" : "нет";
  if (typeof value === "string") {
    const label = VALUE_LABEL[value] ?? value;
    return label.length > MAX_VALUE ? `${label.slice(0, MAX_VALUE)}…` : label;
  }
  if (typeof value === "number") return String(value);
  if (Array.isArray(value))
    return value.length === 0 ? "пусто" : `${value.length} шт.`;
  return "изменено";
}

export type AuditChange = { field: string; before?: string; after?: string };

/**
 * Что поменялось. У правки — только отличающиеся поля, у создания и
 * удаления — снимок без служебного. Сравнение по JSON: снимки целиком
 * лежат в базе, другого способа понять «то же самое» у нас нет.
 */
export function auditChanges(
  before: unknown,
  after: unknown,
  /** id администратора → имя: ответственный по заявке хранится как id. */
  userNames: ReadonlyMap<string, string> = new Map(),
): AuditChange[] {
  const show = (key: string, value: unknown) =>
    key === "assignedToId" && typeof value === "string"
      ? (userNames.get(value) ?? "удалённый администратор")
      : formatValue(value);

  const b = asSnapshot(before);
  const a = asSnapshot(after);
  const keys = [
    ...new Set([...Object.keys(b ?? {}), ...Object.keys(a ?? {})]),
  ].filter((key) => !IGNORED.has(key));

  const changes: AuditChange[] = [];
  for (const key of keys) {
    const field = FIELD_LABEL[key] ?? key;
    if (b && a) {
      if (JSON.stringify(b[key]) === JSON.stringify(a[key])) continue;
      changes.push({
        field,
        before: show(key, b[key]),
        after: show(key, a[key]),
      });
    } else if (a) {
      changes.push({ field, after: show(key, a[key]) });
    } else if (b) {
      changes.push({ field, before: show(key, b[key]) });
    }
  }
  return changes;
}
