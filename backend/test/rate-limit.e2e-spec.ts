import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Redis } from 'ioredis';

/**
 * Лимиты на Redis: два экземпляра бэкенда делят один счётчик, и рестарт
 * его не обнуляет. Нужен настоящий Redis — TEST_REDIS_URL, отдельная база
 * (в CI — сервис). Без него файл пропускается.
 */
const url = process.env.TEST_REDIS_URL;

describe.skipIf(!url)('Лимиты запросов в Redis (e2e)', () => {
  const apps: INestApplication[] = [];
  const base = '/api/v1';

  const start = async () => {
    // ConfigModule читает окружение при импорте AppModule, а setup-env
    // его REDIS_URL стирает — поэтому задаём здесь и импортируем после.
    process.env.REDIS_URL = url;
    const { createTestApp } = await import('./helpers.js');
    const app = await createTestApp();
    apps.push(app);
    return app;
  };

  const login = (app: INestApplication) =>
    request(app.getHttpServer())
      .post(`${base}/auth/login`)
      .send({
        email: 'nobody@tabys.kz',
        password: 'wrong-password-long-enough',
      });

  beforeAll(async () => {
    // Счётчики живут между прогонами: начинаем с чистого листа. Чистим
    // только ключи лимитов и только в тестовой базе Redis.
    const redis = new Redis(url!);
    const keys = await redis.keys('throttle:*');
    if (keys.length > 0) await redis.del(...keys);
    await redis.quit();
  });

  afterAll(async () => {
    await Promise.all(apps.map((app) => app.close()));
    delete process.env.REDIS_URL;
  });

  it('health показывает, что лимиты считаются в Redis', async () => {
    const app = await start();
    const res = await request(app.getHttpServer())
      .get(`${base}/health`)
      .expect(200);
    expect(res.body.rateLimit).toBe('redis');
  });

  it('два экземпляра делят лимит входа, и рестарт его не сбрасывает', async () => {
    const [first, second] = [apps[0], await start()];

    // Лимит логина — 10 за 5 минут. По 5 попыток на каждый экземпляр:
    // с хранилищем в памяти каждый пропустил бы ещё по 5.
    for (let i = 0; i < 5; i++) {
      await login(first).expect(401);
      await login(second).expect(401);
    }
    await login(first).expect(429);
    await login(second).expect(429);

    // «Рестарт»: новое приложение с новым подключением к Redis.
    await second.close();
    apps.splice(apps.indexOf(second), 1);
    const restarted = await start();
    const res = await login(restarted).expect(429);
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
  });
});
