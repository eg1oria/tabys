import { Logger, type OnApplicationShutdown } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { Redis } from 'ioredis';

/**
 * Блокировка входа по адресу, а не по IP. Лимит «10 попыток за 5 минут
 * на IP» не мешает перебору с сотни адресов, а за прокси без TRUST_PROXY
 * вообще общий на всех. Этот счётчик привязан к email: 10 неудач за
 * 15 минут — вход для адреса закрыт на 15 минут, с любого IP.
 *
 * Считаем и несуществующие адреса: иначе «заблокировано» отвечалось бы
 * только на настоящие, и блокировка выдавала бы, какие адреса заведены.
 * Блокировка временная, а не до разблокировки владельцем: иначе любой,
 * кто знает адрес владельца, запирал бы его в одиннадцать запросов.
 */
export const MAX_FAILURES = 10;
export const FAILURE_WINDOW_MS = 15 * 60_000;
export const LOCK_MS = 15 * 60_000;

export const LOGIN_ATTEMPTS = Symbol('LOGIN_ATTEMPTS');

export interface LoginAttempts {
  /** Сколько миллисекунд ещё закрыт вход; 0 — открыт. */
  lockedFor(email: string): Promise<number>;
  /** Записывает неудачу. Вернёт длительность блокировки, если она началась сейчас, иначе 0. */
  recordFailure(email: string): Promise<number>;
  /** Удачный вход обнуляет счётчик неудач. */
  reset(email: string): Promise<void>;
}

/** В ключе — хеш, а не сам адрес: в Redis незачем копить email. */
function key(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

const PREFIX = 'login:';
const ERROR_LOG_EVERY_MS = 60_000;

/** KEYS: счётчик, блокировка. ARGV: окно (мс), лимит, блокировка (мс). */
const FAIL_SCRIPT = `
local hits = redis.call('INCR', KEYS[1])
if hits == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
if hits >= tonumber(ARGV[2]) then
  redis.call('SET', KEYS[2], 1, 'PX', ARGV[3])
  redis.call('DEL', KEYS[1])
  return tonumber(ARGV[3])
end
return 0
`;

/** Счётчики в Redis: общие для всех инстансов и не обнуляются рестартом. */
export class RedisLoginAttempts implements LoginAttempts, OnApplicationShutdown {
  private readonly logger = new Logger(RedisLoginAttempts.name);
  private lastErrorLoggedAt = 0;

  constructor(private readonly redis: Redis) {}

  async lockedFor(email: string): Promise<number> {
    try {
      return Math.max(0, await this.redis.pttl(`${PREFIX}${key(email)}:locked`));
    } catch (error) {
      // Как и лимиты запросов: лежащий Redis не должен запирать админку.
      this.logError(error);
      return 0;
    }
  }

  async recordFailure(email: string): Promise<number> {
    const k = key(email);
    try {
      return (await this.redis.eval(
        FAIL_SCRIPT,
        2,
        `${PREFIX}${k}`,
        `${PREFIX}${k}:locked`,
        FAILURE_WINDOW_MS,
        MAX_FAILURES,
        LOCK_MS,
      )) as number;
    } catch (error) {
      this.logError(error);
      return 0;
    }
  }

  async reset(email: string): Promise<void> {
    try {
      await this.redis.del(`${PREFIX}${key(email)}`);
    } catch (error) {
      this.logError(error);
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
      `Redis недоступен — блокировка входа по адресу временно не действует: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/** В памяти процесса — для локальной разработки и тестов (в проде REDIS_URL обязателен). */
export class MemoryLoginAttempts implements LoginAttempts {
  private readonly failures = new Map<string, { hits: number; until: number }>();
  private readonly locks = new Map<string, number>();

  constructor(private readonly now: () => number = Date.now) {}

  async lockedFor(email: string): Promise<number> {
    const k = key(email);
    const until = this.locks.get(k) ?? 0;
    const left = until - this.now();
    if (left > 0) return left;
    this.locks.delete(k);
    return 0;
  }

  async recordFailure(email: string): Promise<number> {
    const k = key(email);
    const now = this.now();
    const current = this.failures.get(k);
    const entry =
      current && current.until > now
        ? { hits: current.hits + 1, until: current.until }
        : { hits: 1, until: now + FAILURE_WINDOW_MS };

    if (entry.hits >= MAX_FAILURES) {
      this.failures.delete(k);
      this.locks.set(k, now + LOCK_MS);
      return LOCK_MS;
    }
    this.failures.set(k, entry);
    return 0;
  }

  async reset(email: string): Promise<void> {
    this.failures.delete(key(email));
  }
}
