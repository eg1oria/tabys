import {
  Injectable,
  SetMetadata,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';

const PUBLIC_CACHE_KEY = 'publicCache';

/**
 * Опубликованный каталог одинаков для всех и меняется редко: минуту ответ
 * можно отдавать из любого кеша, ещё десять — показывать устаревший, пока
 * идёт обновление. Админка видит правку сразу — она читает /admin/*.
 */
export const PUBLIC_CACHE_CONTROL =
  'public, max-age=60, stale-while-revalidate=600';

/** GET этого контроллера (или метода) можно кешировать — см. PUBLIC_CACHE_CONTROL. */
export const PublicCache = () => SetMetadata(PUBLIC_CACHE_KEY, true);

/**
 * Cache-Control для каждого ответа API. По умолчанию — no-store: заявки,
 * токены и админские списки не должны оседать ни в каком кеше по пути.
 * Кешируются только GET под @PublicCache. Ошибки фильтр исключений
 * помечает no-store сам. ETag и 304 на повторный запрос Express ставит
 * сам — тело в этом случае по сети не идёт.
 */
@Injectable()
export class CacheControlInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const cacheable =
      request.method === 'GET' &&
      this.reflector.getAllAndOverride<boolean>(PUBLIC_CACHE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    response.setHeader(
      'Cache-Control',
      cacheable ? PUBLIC_CACHE_CONTROL : 'no-store',
    );
    return next.handle();
  }
}
