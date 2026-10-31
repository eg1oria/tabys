import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, truncateAll, ADMIN_EMAIL, ADMIN_PASSWORD } from './helpers.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { PasswordService } from '../src/auth/password.service.js';
import { TokenService } from '../src/auth/token.service.js';

describe('Авторизация (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const base = '/api/v1';

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    await truncateAll(prisma);
    await prisma.adminUser.create({
      data: {
        email: ADMIN_EMAIL,
        name: 'E2E',
        role: 'OWNER',
        passwordHash: await app.get(PasswordService).hash(ADMIN_PASSWORD),
      },
    });
  });

  afterAll(async () => {
    await truncateAll(prisma);
    await app?.close();
  });

  const login = () =>
    request(app.getHttpServer())
      .post(`${base}/auth/login`)
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

  it('админский маршрут без токена отдаёт 401', async () => {
    await request(app.getHttpServer()).get(`${base}/admin/categories`).expect(401);
  });

  it('неверный пароль — 401', async () => {
    await request(app.getHttpServer())
      .post(`${base}/auth/login`)
      .send({ email: ADMIN_EMAIL, password: 'definitely-wrong-password' })
      .expect(401);
  });

  it('несуществующий пользователь — тоже 401, без подсказки', async () => {
    const res = await request(app.getHttpServer())
      .post(`${base}/auth/login`)
      .send({ email: 'nobody@tabys.kz', password: 'definitely-wrong-password' })
      .expect(401);
    expect(res.body.message).toBe('Неверный email или пароль');
  });

  it('логин выдаёт пару токенов, access открывает /auth/me', async () => {
    const res = await login().expect(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();

    const me = await request(app.getHttpServer())
      .get(`${base}/auth/me`)
      .set('Authorization', `Bearer ${res.body.accessToken}`)
      .expect(200);
    expect(me.body.email).toBe(ADMIN_EMAIL);
    expect(me.body).not.toHaveProperty('passwordHash');
  });

  it('refresh-токеном нельзя ходить по API вместо access', async () => {
    const { body } = await login().expect(200);
    await request(app.getHttpServer())
      .get(`${base}/auth/me`)
      .set('Authorization', `Bearer ${body.refreshToken}`)
      .expect(401);
  });

  const refresh = (refreshToken: string) =>
    request(app.getHttpServer()).post(`${base}/auth/refresh`).send({ refreshToken });

  /**
   * Пара в обход /auth/login: тесты ротации проверяют не вход, а лимит
   * логина (10 за 5 минут) иначе кончился бы посреди файла.
   */
  const session = async () => {
    const user = await prisma.adminUser.findUniqueOrThrow({ where: { email: ADMIN_EMAIL } });
    return { body: await app.get(TokenService).issuePair(user) };
  };

  /** Сдвигает отзыв токена в прошлое — за пределы льготного окна. */
  const ageRevocation = (seconds: number) =>
    prisma.refreshToken.updateMany({
      where: { revokedAt: { not: null } },
      data: { revokedAt: new Date(Date.now() - seconds * 1000) },
    });

  it('ротация выдаёт новый refresh, а повторное использование старого гасит семейство', async () => {
    const { body: first } = await login().expect(200);

    const { body: second } = await refresh(first.refreshToken).expect(200);
    expect(second.refreshToken).not.toBe(first.refreshToken);

    // Предъявление отозванного токена за пределами льготного окна —
    // утечка: гасим всё семейство.
    await ageRevocation(60);
    await refresh(first.refreshToken).expect(401);

    // ...поэтому и свежий токен из этого семейства больше не работает.
    await refresh(second.refreshToken).expect(401);
  });

  it('параллельные обновления одним токеном получают одну пару, а не гасят сессию', async () => {
    const { body: first } = await session();

    // Два экземпляра Next с одной cookie: у каждого своя карта single-flight,
    // и до бэкенда доходят оба запроса.
    const results = await Promise.all([
      refresh(first.refreshToken),
      refresh(first.refreshToken),
      refresh(first.refreshToken),
    ]);
    expect(results.map((r) => r.status)).toEqual([200, 200, 200]);
    const tokens = new Set(results.map((r) => r.body.refreshToken));
    expect(tokens.size).toBe(1);

    // Сессия жива: общий наследник ротируется дальше как обычно.
    const [shared] = tokens;
    await refresh(shared as string).expect(200);
  });

  it('повтор в льготном окне отдаёт того же наследника, семейство живо', async () => {
    const { body: first } = await session();
    const { body: second } = await refresh(first.refreshToken).expect(200);

    const { body: replay } = await refresh(first.refreshToken).expect(200);
    expect(replay.refreshToken).toBe(second.refreshToken);
    await refresh(second.refreshToken).expect(200);
  });

  it('окно не спасает, если наследник уже ротирован дальше', async () => {
    const { body: first } = await session();
    const { body: second } = await refresh(first.refreshToken).expect(200);
    const { body: third } = await refresh(second.refreshToken).expect(200);

    await refresh(first.refreshToken).expect(401);
    await refresh(third.refreshToken).expect(401);
  });

  it('окно не воскрешает сессию после выхода', async () => {
    const { body: first } = await session();
    await refresh(first.refreshToken).expect(200);
    await request(app.getHttpServer())
      .post(`${base}/auth/logout`)
      .send({ refreshToken: first.refreshToken })
      .expect(204);

    await refresh(first.refreshToken).expect(401);
  });

  it('logout отзывает семейство', async () => {
    const { body } = await login().expect(200);
    await request(app.getHttpServer())
      .post(`${base}/auth/logout`)
      .send({ refreshToken: body.refreshToken })
      .expect(204);
    await request(app.getHttpServer())
      .post(`${base}/auth/refresh`)
      .send({ refreshToken: body.refreshToken })
      .expect(401);
  });

  it('отключённый админ не проходит даже с живым токеном', async () => {
    const { body } = await login().expect(200);
    await prisma.adminUser.update({
      where: { email: ADMIN_EMAIL },
      data: { isActive: false },
    });

    await request(app.getHttpServer())
      .get(`${base}/auth/me`)
      .set('Authorization', `Bearer ${body.accessToken}`)
      .expect(401);

    await prisma.adminUser.update({
      where: { email: ADMIN_EMAIL },
      data: { isActive: true },
    });
  });
});
