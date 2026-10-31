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

/** Что посетитель отправил — чтобы вернуть это в поля после ошибки. */
export type RequestValues = {
  name: string;
  phone: string;
  email: string;
  message: string;
  consent: boolean;
  /** Момент показа формы: при перемонтировании не должен обнуляться. */
  renderedAt: string;
  /** Файл браузер вернуть не даёт — только просим прикрепить заново. */
  hadAttachment: boolean;
};

export type RequestState = {
  status: "idle" | "success" | "error";
  /** Ключ "_form" — ошибка доставки целиком, а не конкретного поля. */
  errors: Record<string, string>;
  /**
   * React 19 сбрасывает поля формы после любого действия, в том числе
   * неудачного: опечатка в телефоне стирала имя, сообщение и согласие.
   * После ошибки форма перемонтируется (key={submissionId}) с этими значениями.
   */
  values?: RequestValues;
  submissionId?: number;
};

export const initialRequestState: RequestState = { status: "idle", errors: {} };
