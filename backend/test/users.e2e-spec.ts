import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  truncateAll,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
} from './helpers.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { PasswordService } from '../src/auth/password.service.js';

const EDITOR_EMAIL = 'e2e-editor@tabys.kz';

describe('Администраторы и роли (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let owner: string;
  let editor: string;
  let ownerId: string;
  let editorId: string;
  const base = '/api/v1';

  const login = async (email: string, password = ADMIN_PASSWORD) => {
    const res = await request(app.getHttpServer())
      .post(`${base}/auth/login`)
      .send({ email, password });
    return res;
  };
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    await truncateAll(prisma);

    const passwordHash = await app.get(PasswordService).hash(ADMIN_PASSWORD);
    const o = await prisma.adminUser.create({
      data: {
        email: ADMIN_EMAIL,
        name: 'Владелец',
        role: 'OWNER',
        passwordHash,
      },
    });
    const e = await prisma.adminUser.create({
      data: {
        email: EDITOR_EMAIL,
        name: 'Менеджер',
        role: 'EDITOR',
        passwordHash,
      },
    });
    ownerId = o.id;
    editorId = e.id;
    owner = (await login(ADMIN_EMAIL)).body.accessToken;
    editor = (await login(EDITOR_EMAIL)).body.accessToken;
  });

  afterAll(async () => {
    await truncateAll(prisma);
    await app?.close();
  });

  describe('редактору закрыто необратимое и структурное', () => {
    const forbidden: [string, string][] = [
      ['delete', '/admin/products/any-id'],
      ['delete', '/admin/categories/any-id'],
      ['delete', '/admin/media/any-id'],
      ['post', '/admin/facets/values'],
      ['patch', '/admin/facets/values/any-id'],
      ['delete', '/admin/facets/values/any-id'],
      ['get', '/admin/users/all'],
      ['post', '/admin/users'],
      ['patch', '/admin/users/any-id'],
      ['post', '/admin/users/any-id/reset-password'],
      ['get', '/admin/audit'],
    ];

    it.each(forbidden)('%s %s → 403', async (method, path) => {
      await request(app.getHttpServer())
        [method as 'get'](`${base}${path}`)
        .set(as(editor))
        .send({})
        .expect(403);
    });

    it('а заявки, товары и список для назначения — открыты', async () => {
      for (const path of ['/admin/leads', '/admin/products', '/admin/users']) {
        await request(app.getHttpServer())
          .get(`${base}${path}`)
          .set(as(editor))
          .expect(200);
      }
    });
  });

  it('владелец создаёт администратора, и тот входит временным паролем', async () => {
    const res = await request(app.getHttpServer())
      .post(`${base}/admin/users`)
      .set(as(owner))
      .send({ email: ' New@Tabys.kz ', name: 'Новый', role: 'EDITOR' })
      .expect(201);

    expect(res.body.user.email).toBe('new@tabys.kz');
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.body.password).toHaveLength(16);

    const signIn = await login('new@tabys.kz', res.body.password);
    expect(signIn.status).toBe(200);
  });

  it('журнал показывает владельцу, кто и что сделал', async () => {
    const res = await request(app.getHttpServer())
      .get(`${base}/admin/audit?entity=AdminUser&perPage=5`)
      .set(as(owner))
      .expect(200);

    const created = res.body.data.find(
      (row: { action: string }) => row.action === 'user.create',
    );
    expect(created).toMatchObject({
      entity: 'AdminUser',
      actor: { email: ADMIN_EMAIL },
      after: { email: 'new@tabys.kz', role: 'EDITOR' },
    });
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/);

    // Фильтр по разделу действительно фильтрует.
    const other = await request(app.getHttpServer())
      .get(`${base}/admin/audit?entity=Product`)
      .set(as(owner))
      .expect(200);
    expect(other.body.meta.total).toBe(0);

    await request(app.getHttpServer())
      .get(`${base}/admin/audit?entity=passwordHash`)
      .set(as(owner))
      .expect(400);
  });

  it('второй администратор с тем же email — 409', async () => {
    const res = await request(app.getHttpServer())
      .post(`${base}/admin/users`)
      .set(as(owner))
      .send({ email: EDITOR_EMAIL, name: 'Дубль', role: 'EDITOR' })
      .expect(409);
    expect(res.body.message).toMatch(/уже есть/);
  });

  it('отключённый не входит и теряет сессии; список «все» его показывает', async () => {
    const { body: created } = await request(app.getHttpServer())
      .post(`${base}/admin/users`)
      .set(as(owner))
      .send({ email: 'gone@tabys.kz', name: 'Уходит', role: 'EDITOR' })
      .expect(201);
    const session = await login('gone@tabys.kz', created.password);

    await request(app.getHttpServer())
      .patch(`${base}/admin/users/${created.user.id}`)
      .set(as(owner))
      .send({ isActive: false })
      .expect(200);

    await request(app.getHttpServer())
      .get(`${base}/auth/me`)
      .set(as(session.body.accessToken))
      .expect(401);
    await request(app.getHttpServer())
      .post(`${base}/auth/refresh`)
      .send({ refreshToken: session.body.refreshToken })
      .expect(401);
    expect((await login('gone@tabys.kz', created.password)).status).toBe(401);

    const all = await request(app.getHttpServer())
      .get(`${base}/admin/users/all`)
      .set(as(owner))
      .expect(200);
    expect(all.body.map((u: { email: string }) => u.email)).toContain(
      'gone@tabys.kz',
    );
    const active = await request(app.getHttpServer())
      .get(`${base}/admin/users`)
      .set(as(owner))
      .expect(200);
    expect(active.body.map((u: { email: string }) => u.email)).not.toContain(
      'gone@tabys.kz',
    );
  });

  it('сброс пароля: старый не подходит, новый — да, сессии завершены', async () => {
    const before = await login(EDITOR_EMAIL);
    const res = await request(app.getHttpServer())
      .post(`${base}/admin/users/${editorId}/reset-password`)
      .set(as(owner))
      .expect(200);

    expect((await login(EDITOR_EMAIL)).status).toBe(401);
    const after = await login(EDITOR_EMAIL, res.body.password);
    expect(after.status).toBe(200);
    editor = after.body.accessToken;

    await request(app.getHttpServer())
      .post(`${base}/auth/refresh`)
      .send({ refreshToken: before.body.refreshToken })
      .expect(401);
  });

  it('свою роль и доступ владелец не меняет — и пароль сбрасывает в профиле', async () => {
    await request(app.getHttpServer())
      .patch(`${base}/admin/users/${ownerId}`)
      .set(as(owner))
      .send({ role: 'EDITOR' })
      .expect(400);
    await request(app.getHttpServer())
      .patch(`${base}/admin/users/${ownerId}`)
      .set(as(owner))
      .send({ isActive: false })
      .expect(400);
    await request(app.getHttpServer())
      .post(`${base}/admin/users/${ownerId}/reset-password`)
      .set(as(owner))
      .expect(400);

    // Имя своё — можно.
    await request(app.getHttpServer())
      .patch(`${base}/admin/users/${ownerId}`)
      .set(as(owner))
      .send({ name: 'Главный' })
      .expect(200);
  });

  it('роль меняется сразу, без перевыпуска токена', async () => {
    await request(app.getHttpServer())
      .patch(`${base}/admin/users/${editorId}`)
      .set(as(owner))
      .send({ role: 'OWNER' })
      .expect(200);
    // Гвард читает роль из базы, а не из токена.
    await request(app.getHttpServer())
      .get(`${base}/admin/users/all`)
      .set(as(editor))
      .expect(200);
  });

  it('два владельца, понижающие друг друга одновременно, не оставят админку без владельца', async () => {
    const [a, b] = await Promise.all([
      request(app.getHttpServer())
        .patch(`${base}/admin/users/${editorId}`)
        .set(as(owner))
        .send({ role: 'EDITOR' }),
      request(app.getHttpServer())
        .patch(`${base}/admin/users/${ownerId}`)
        .set(as(editor))
        .send({ role: 'EDITOR' }),
    ]);

    expect([a.status, b.status].sort((x, y) => x - y)).toEqual([200, 400]);
    expect((a.status === 400 ? a : b).body.message).toMatch(
      /последний владелец/,
    );
    const owners = await prisma.adminUser.count({
      where: { role: 'OWNER', isActive: true },
    });
    expect(owners).toBe(1);
  });
});
