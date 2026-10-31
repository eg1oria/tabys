import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';

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
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

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
    } else {
      this.logger.warn(`${requestId} ${request.method} ${request.url} -> ${body.statusCode} ${body.message}`);
    }

    response.status(body.statusCode).json(body);
  }
}
