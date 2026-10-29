/**
 * Конверт ошибок бэкенда (backend/src/common/filters/all-exceptions.filter.ts):
 * { statusCode, message, errors?, requestId, path, timestamp }.
 *
 * `errors` у валидации — плоский список сообщений, без привязки к полям,
 * поэтому в формах он показывается целиком над формой, а не под полем.
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly errors: string[];
  readonly requestId?: string;

  constructor(statusCode: number, message: string, errors: string[] = [], requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
    this.requestId = requestId;
  }

  /** Все сообщения одним списком — то, что показываем человеку. */
  get messages(): string[] {
    return this.errors.length > 0 ? this.errors : [this.message];
  }
}

/** Бэкенд недоступен или ответил не-JSON. Отличается от ApiError отсутствием statusCode. */
export class ApiUnreachableError extends Error {
  constructor(cause?: unknown) {
    super("Сервер админки недоступен");
    this.name = "ApiUnreachableError";
    this.cause = cause;
  }
}

export async function toApiError(response: Response): Promise<ApiError> {
  let message = `Ошибка ${response.status}`;
  let errors: string[] = [];
  let requestId: string | undefined;

  try {
    const body: unknown = await response.json();
    if (body !== null && typeof body === "object") {
      const envelope = body as { message?: unknown; errors?: unknown; requestId?: unknown };
      if (typeof envelope.message === "string") message = envelope.message;
      if (Array.isArray(envelope.errors)) {
        errors = envelope.errors.filter((e): e is string => typeof e === "string");
      }
      if (typeof envelope.requestId === "string") requestId = envelope.requestId;
    }
  } catch {
    // Не-JSON в теле ошибки — оставляем сообщение по статусу.
  }

  return new ApiError(response.status, message, errors, requestId);
}
