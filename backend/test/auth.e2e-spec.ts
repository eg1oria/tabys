import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, truncateAll, ADMIN_EMAIL, ADMIN_PASSWORD } from './helpers.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { PasswordService } from '../src/auth/password.service.js';

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

  it('ротация выдаёт новый refresh, а повторное использование старого гасит семейство', async () => {
    const { body: first } = await login().expect(200);

    const { body: second } = await request(app.getHttpServer())
      .post(`${base}/auth/refresh`)
      .send({ refreshToken: first.refreshToken })
      .expect(200);
    expect(second.refreshToken).not.toBe(first.refreshToken);

    // Предъявление отозванного токена означает утечку — гасим всё семейство.
    await request(app.getHttpServer())
      .post(`${base}/auth/refresh`)
      .send({ refreshToken: first.refreshToken })
      .expect(401);

    // ...поэтому и свежий токен из этого семейства больше не работает.
    await request(app.getHttpServer())
      .post(`${base}/auth/refresh`)
      .send({ refreshToken: second.refreshToken })
      .expect(401);
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
