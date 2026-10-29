/**
 * Типы и константы формы заявки держим отдельно от самого Server Action:
 * модуль с "use server" может экспортировать только асинхронные функции,
 * иначе обычные экспорты превращаются в серверные ссылки и ломают клиент.
 */

export const MAX_FILE_BYTES = 4 * 1024 * 1024;

export const ALLOWED_EXTENSIONS = [
  "pdf", "doc", "docx", "xls", "xlsx", "dwg", "dxf",
  "jpg", "jpeg", "png", "zip", "rar", "7z",
];

export type RequestState = {
  status: "idle" | "success" | "error";
  /** Ключ "_form" — ошибка доставки целиком, а не конкретного поля. */
  errors: Record<string, string>;
};

export const initialRequestState: RequestState = { status: "idle", errors: {} };
