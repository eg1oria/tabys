import { randomUUID } from 'node:crypto';
import { Redis } from 'ioredis';
import { RedisThrottlerStorage } from './redis-throttler.storage.js';

/**
 * Против настоящего Redis: суть хранилища — общий счётчик между процессами,
 * и подделка клиента его не проверила бы. Без TEST_REDIS_URL тесты пропускаются;
 * в CI Redis поднят сервисом.
 */
const url = process.env.TEST_REDIS_URL;

describe.skipIf(!url)('RedisThrottlerStorage', () => {
  const opened: RedisThrottlerStorage[] = [];
  const storage = () => {
    const instance = RedisThrottlerStorage.fromUrl(url!);
    opened.push(instance);
    return instance;
  };
  // Свой ключ на каждый тест: счётчики живут в Redis между запусками.
  let key: string;
  beforeEach(() => {
    key = `spec:${randomUUID()}`;
  });

  afterAll(async () => {
    await Promise.all(opened.map((s) => s.onApplicationShutdown()));
  });

  it('два инстанса делят один лимит, а не получают по своему', async () => {
    const a = storage();
    const b = storage();

    const results = [];
    for (let i = 0; i < 3; i++) {
      results.push(await a.increment(key, 60_000, 4, 60_000, 'default'));
      results.push(await b.increment(key, 60_000, 4, 60_000, 'default'));
    }

    expect(results.map((r) => r.isBlocked)).toEqual([
      false,
      false,
      false,
      false,
      true,
      true,
    ]);
    expect(results[3].totalHits).toBe(4);
  });

  it('рестарт не обнуляет счётчик: новое подключение видит прежние попытки', async () => {
    const before = storage();
    await before.increment(key, 60_000, 2, 60_000, 'default');
    await before.increment(key, 60_000, 2, 60_000, 'default');
    await before.onApplicationShutdown();
    opened.splice(opened.indexOf(before), 1);

    const after = await storage().increment(key, 60_000, 2, 60_000, 'default');
    expect(after.isBlocked).toBe(true);
    expect(after.timeToBlockExpire).toBeGreaterThan(0);
    expect(after.timeToBlockExpire).toBeLessThanOrEqual(60);
  });

  it('параллельные запросы не проскакивают сверх лимита', async () => {
    const s = storage();
    const results = await Promise.all(
      Array.from({ length: 20 }, () =>
        s.increment(key, 60_000, 5, 60_000, 'default'),
      ),
    );
    expect(results.filter((r) => !r.isBlocked)).toHaveLength(5);
  });

  it('после блокировки окно начинается заново', async () => {
    const s = storage();
    await s.increment(key, 200, 1, 200, 'default');
    expect((await s.increment(key, 200, 1, 200, 'default')).isBlocked).toBe(
      true,
    );

    await new Promise((resolve) => setTimeout(resolve, 300));
    const next = await s.increment(key, 200, 1, 200, 'default');
    expect(next).toMatchObject({ isBlocked: false, totalHits: 1 });
  });

  it('ключи истекают сами — Redis не копит счётчики', async () => {
    const s = storage();
    await s.increment(key, 60_000, 1, 30_000, 'default');
    await s.increment(key, 60_000, 1, 30_000, 'default');

    const redis = new Redis(url!);
    try {
      const keys = await redis.keys(`throttle:${key}*`);
      expect(keys.length).toBeGreaterThan(0);
      for (const k of keys) expect(await redis.pttl(k)).toBeGreaterThan(0);
    } finally {
      await redis.quit();
    }
  });
});

describe('RedisThrottlerStorage без Redis', () => {
  it('пропускает запрос, а не роняет его: форма заявки важнее лимита', async () => {
    // Порт 9 (discard) заведомо не Redis.
    const s = RedisThrottlerStorage.fromUrl('redis://127.0.0.1:9');
    try {
      const record = await s.increment('down', 60_000, 1, 60_000, 'default');
      expect(record).toEqual({
        totalHits: 0,
        timeToExpire: 60,
        isBlocked: false,
        timeToBlockExpire: 0,
      });
      expect(await s.isReachable()).toBe(false);
    } finally {
      await s.onApplicationShutdown();
    }
  });
});
