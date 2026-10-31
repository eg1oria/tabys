import { Redis } from 'ioredis';

/**
 * Подключение для счётчиков (лимиты запросов, неудачные входы). Очередь
 * оставляем: без неё команды до первого соединения отвергаются, и сразу
 * после старта счётчики бы не действовали. Зависнуть запросу не дают
 * таймаут и один повтор: пока Redis недоступен, ждём не дольше секунды.
 */
export function connectRedis(url: string): Redis {
  return new Redis(url, {
    maxRetriesPerRequest: 1,
    commandTimeout: 1000,
    connectTimeout: 3000,
  });
}
