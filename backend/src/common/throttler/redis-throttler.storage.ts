import { Logger, type OnApplicationShutdown } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import { Redis } from 'ioredis';

/** Пакет не реэкспортирует тип записи — берём его из сигнатуры increment. */
type ThrottlerStorageRecord = Awaited<
  ReturnType<ThrottlerStorage['increment']>
>;

const PREFIX = 'throttle:';
/** Не чаще раза в минуту: при лежащем Redis ошибка была бы в каждом запросе. */
const ERROR_LOG_EVERY_MS = 60_000;

/**
 * Окно и блокировка одним скриптом — атомарно, иначе два инстанса между
 * INCR и PEXPIRE успевали бы насчитать лишнее.
 *
 * Фиксированное окно, как у встроенного хранилища: первый запрос заводит
 * счётчик на ttl. Превысили лимит — ставим отдельный ключ блокировки на
 * blockDuration, а счётчик сбрасываем: после блокировки окно начинается
 * заново (так же ведёт себя ThrottlerStorageService).
 *
 * KEYS: счётчик, блокировка. ARGV: ttl (мс), limit, blockDuration (мс).
 * Ответ: { hits, мс до конца окна, заблокирован ли, мс до конца блокировки }.
 */
const SCRIPT = `
local blocked = redis.call('PTTL', KEYS[2])
if blocked > 0 then
  return { tonumber(ARGV[2]) + 1, blocked, 1, blocked }
end

local hits = redis.call('INCR', KEYS[1])
if hits == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local window = redis.call('PTTL', KEYS[1])

if hits > tonumber(ARGV[2]) then
  redis.call('SET', KEYS[2], 1, 'PX', ARGV[3])
  redis.call('DEL', KEYS[1])
  return { hits, window, 1, tonumber(ARGV[3]) }
end
return { hits, window, 0, 0 }
`;

const seconds = (ms: number) => Math.max(0, Math.ceil(ms / 1000));

/**
 * Счётчики лимитов в Redis, а не в памяти процесса: иначе каждый инстанс
 * бэкенда считал бы свой лимит (два инстанса — вдвое больше попыток входа
 * и заявок), а рестарт обнулял бы всё накопленное.
 */
export class RedisThrottlerStorage
  implements ThrottlerStorage, OnApplicationShutdown
{
  private readonly logger = new Logger(RedisThrottlerStorage.name);
  private lastErrorLoggedAt = 0;

  constructor(private readonly redis: Redis) {}

  static fromUrl(url: string): RedisThrottlerStorage {
    return new RedisThrottlerStorage(
      new Redis(url, {
        // Очередь оставляем: без неё команды до первого соединения
        // отвергаются, и сразу после старта лимиты бы не действовали.
        // Зависнуть запросу не дают таймаут и один повтор: пока Redis
        // недоступен, ждём не дольше секунды и пропускаем запрос.
        maxRetriesPerRequest: 1,
        commandTimeout: 1000,
        connectTimeout: 3000,
      }),
    );
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    _throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    try {
      const [hits, window, blocked, blockLeft] = (await this.redis.eval(
        SCRIPT,
        2,
        `${PREFIX}${key}`,
        `${PREFIX}${key}:blocked`,
        ttl,
        limit,
        blockDuration,
      )) as [number, number, number, number];

      return {
        totalHits: hits,
        timeToExpire: seconds(window),
        isBlocked: blocked === 1,
        timeToBlockExpire: seconds(blockLeft),
      };
    } catch (error) {
      // Пропускаем запрос, а не отвечаем 500: лимит — вторая линия защиты
      // (у входа медленный argon2, у заявок honeypot), а лежащий Redis
      // не должен ронять форму заявки и вход в админку.
      this.logError(error);
      return {
        totalHits: 0,
        timeToExpire: seconds(ttl),
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }
  }

  /** Для /health: отвечает ли Redis прямо сейчас. */
  async isReachable(): Promise<boolean> {
    try {
      return (await this.redis.ping()) === 'PONG';
    } catch {
      return false;
    }
  }

  async onApplicationShutdown(): Promise<void> {
    await this.redis.quit().catch(() => this.redis.disconnect());
  }

  private logError(error: unknown): void {
    const now = Date.now();
    if (now - this.lastErrorLoggedAt < ERROR_LOG_EVERY_MS) return;
    this.lastErrorLoggedAt = now;
    this.logger.error(
      `Redis недоступен — лимиты запросов временно не действуют: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
