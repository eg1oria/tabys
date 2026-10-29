import { ApiError, ApiUnreachableError } from "../api/errors";

/**
 * Состояние форм админки. Держим отдельно от модулей с "use server":
 * оттуда можно экспортировать только асинхронные функции, иначе обычные
 * экспорты превращаются в серверные ссылки и ломают клиент
 * (та же причина, что в src/lib/actions/request-state.ts).
 */
export type FormState = {
  status: "idle" | "success" | "error";
  errors: Record<string, string>;
  /**
   * Что человек отправил. React 19 сбрасывает неуправляемые поля после
   * завершения действия — в том числе неудачного, — поэтому после ошибки
   * форма пересевается этими значениями, иначе ввод пропадает вместе с
   * показом ошибки.
   */
  values?: Record<string, string | string[]>;
  /** Меняется с каждой отправкой: по нему перемонтируется форма. */
  submissionId?: number;
};

export const initialFormState: FormState = { status: "idle", errors: {} };

/** Одно строковое значение из возвращённых формой. */
export function str(values: FormState["values"], name: string): string | undefined {
  const value = values?.[name];
  return typeof value === "string" ? value : undefined;
}

/** Список значений (чекбоксы, повторяющиеся поля). */
export function list(values: FormState["values"], name: string): string[] | undefined {
  const value = values?.[name];
  return Array.isArray(value) ? value : undefined;
}

/** Ключ для ошибки, которая относится к форме целиком, а не к полю. */
export const FORM_ERROR = "_form";

export function formError(message: string): FormState {
  return { status: "error", errors: { [FORM_ERROR]: message } };
}

/** Дополняет состояние ошибки тем, что ввёл пользователь. */
export function withValues(
  state: FormState,
  prev: FormState,
  values: Record<string, string | string[]>,
): FormState {
  return { ...state, values, submissionId: (prev.submissionId ?? 0) + 1 };
}

/**
 * Раскладывает сообщения бэкенда по полям.
 *
 * class-validator ставит имя свойства первым словом ("title must be
 * longer..."), но в этом бэкенде большинство сообщений кастомные и
 * начинаются с текста ("Укажите ваше имя"). Что не удалось сопоставить —
 * показываем ошибкой формы, а не прячем.
 */
export function toFieldErrors(
  messages: string[],
  fields: readonly string[],
): Record<string, string> {
  const errors: Record<string, string> = {};
  const rest: string[] = [];

  for (const message of messages) {
    const head = message.split(/[\s:]/, 1)[0];
    if (fields.includes(head) && !errors[head]) {
      errors[head] = message;
    } else {
      rest.push(message);
    }
  }

  if (rest.length > 0) errors[FORM_ERROR] = rest.join(". ");
  return errors;
}

/** Ошибка запроса → состояние формы. */
export function toFormState(error: unknown, fields: readonly string[] = []): FormState {
  if (error instanceof ApiError) {
    if (error.statusCode === 429) {
      return formError("Слишком много запросов. Подождите немного и повторите.");
    }
    return { status: "error", errors: toFieldErrors(error.messages, fields) };
  }

  if (error instanceof ApiUnreachableError) {
    return formError("Сервер админки не отвечает. Проверьте, запущен ли бэкенд.");
  }

  throw error;
}

/**
 * Куда вернуться после входа. Принимаем только внутренние пути админки:
 * ?next= приходит из адресной строки, и без проверки это open redirect.
 */
export function safeNext(next: unknown, fallback = "/admin"): string {
  if (typeof next !== "string" || !next.startsWith("/admin")) return fallback;
  // "//evil.com" тоже начинается со слеша и уводит на другой домен.
  if (next.startsWith("//")) return fallback;
  return next;
}
