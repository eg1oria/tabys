import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';

/** Событие о 5xx: его слушает OpsAlerts и шлёт владельцу в Telegram. */
export const SERVER_ERROR = 'server.error';

export type ServerErrorEvent = {
  requestId: string;
  method: string;
  /** Шаблон маршрута (/admin/products/:id), а не адрес: по нему склеиваются повторы. */
  route: string;
  error: string;
};

type ErrorBody = {
  statusCode: number;
  message: string;
  errors?: Record<string, string> | string[];
  requestId: string;
  path: string;
  timestamp: string;
};

/** Коды Prisma, у которых есть осмысленный HTTP-эквивалент. */
const PRISMA_STATUS: Record<string, { status: number; message: string }> = {
  P2002: { status: HttpStatus.CONFLICT, message: 'Запись с таким значением уже существует' },
  P2003: { status: HttpStatus.BAD_REQUEST, message: 'Ссылка на несуществующую запись' },
  P2025: { status: HttpStatus.NOT_FOUND, message: 'Запись не найдена' },
};

export function prismaCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === 'string' && /^P\d{4}$/.test(code)) return code;
  }
  return undefined;
}

/**
 * Единая точка превращения исключений в ответ. Клиенту не уходит ни стек,
 * ни текст ошибки драйвера — только requestId, по которому строку найдут в логах.
 *
 * Регистрируется через APP_FILTER (app.module.ts), а не useGlobalFilters:
 * так у фильтра есть DI и он может сообщить о сбое.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly events: EventEmitter2) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = randomUUID();

    const body: ErrorBody = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Внутренняя ошибка сервера',
      requestId,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (exception instanceof HttpException) {
      body.statusCode = exception.getStatus();
      const payload = exception.getResponse();

      if (typeof payload === 'string') {
        body.message = payload;
      } else if (typeof payload === 'object' && payload !== null) {
        const record = payload as Record<string, unknown>;
        const message = record.message;
        // ValidationPipe отдаёт message массивом строк — это ошибки полей.
        if (Array.isArray(message)) {
          body.message = 'Проверьте заполнение полей';
          body.errors = message.map(String);
        } else if (typeof message === 'string') {
          body.message = message;
        }
      }
    } else {
      const code = prismaCode(exception);
      const mapped = code ? PRISMA_STATUS[code] : undefined;
      if (mapped) {
        body.statusCode = mapped.status;
        body.message = mapped.message;
      }
    }

    if (body.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${requestId} ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
      const route = (request.route as { path?: string } | undefined)?.path;
      const event: ServerErrorEvent = {
        requestId,
        method: request.method,
        route: route ?? request.path,
        error:
          exception instanceof Error
            ? `${exception.name}: ${exception.message}`
            : String(exception),
      };
      this.events.emit(SERVER_ERROR, event);
    } else {
      this.logger.warn(`${requestId} ${request.method} ${request.url} -> ${body.statusCode} ${body.message}`);
    }

    // Ошибку не кешируем нигде: иначе сбой на минуту пережил бы починку.
    response.setHeader('Cache-Control', 'no-store');
    response.status(body.statusCode).json(body);
  }
}
