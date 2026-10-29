import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, truncateAll, ADMIN_EMAIL, ADMIN_PASSWORD } from './helpers.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { PasswordService } from '../src/auth/password.service.js';

const PDF = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n');

describe('Заявки (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
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
    const res = await request(app.getHttpServer())
      .post(`${base}/auth/login`)
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
      .expect(200);
    token = res.body.accessToken;
  });

  afterAll(async () => {
    await truncateAll(prisma);
    await app?.close();
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  it('принимает заявку и сохраняет её (раньше заявки только писались в консоль)', async () => {
    const res = await request(app.getHttpServer())
      .post(`${base}/public/leads`)
      .field('name', 'Дмитрий')
      .field('phone', '+7 (707) 267-12-37')
      .field('email', 'd@example.kz')
      .field('message', 'Нужна сыроварня')
      .field('consent', 'true')
      .expect(201);

    expect(res.body.status).toBe('NEW');

    const lead = await prisma.lead.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(lead.name).toBe('Дмитрий');
    // Цифры нормализованы — по ним ищут и находят дубли.
    expect(lead.phoneDigits).toBe('77072671237');
    // Согласие — отметка времени, а не булев флаг.
    expect(lead.consentAt).toBeInstanceOf(Date);
  });

  it('сохраняет байты вложения, а имя на диске не содержит оригинального', async () => {
    const res = await request(app.getHttpServer())
      .post(`${base}/public/leads`)
      .field('name', 'Андрей')
      .field('phone', '+77052862686')
      .field('consent', 'true')
      .attach('attachment', PDF, 'Техзадание на сыроварню.pdf')
      .expect(201);

    const attachment = await prisma.leadAttachment.findFirstOrThrow({
      where: { leadId: res.body.id },
    });
    expect(attachment.originalName).toBe('Техзадание на сыроварню.pdf');
    expect(attachment.mimeType).toBe('application/pdf');
    expect(attachment.bytes).toBe(PDF.byteLength);
    // Пользовательское имя не должно попадать в путь на диске.
    expect(attachment.storageKey).not.toContain('Техзадание');
    expect(attachment.storageKey).toMatch(/^leads\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.pdf$/);
  });

  it('требует согласие', async () => {
    const res = await request(app.getHttpServer())
      .post(`${base}/public/leads`)
      .field('name', 'Иван')
      .field('phone', '+77001234567')
      .expect(400);
    expect(res.body.errors).toContain('Нужно согласие на обработку данных');
  });

  it('повторяет сообщения валидации фронтенда', async () => {
    const res = await request(app.getHttpServer())
      .post(`${base}/public/leads`)
      .field('name', 'И')
      .field('phone', '123')
      .field('consent', 'true')
      .expect(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining(['Укажите ваше имя', 'Укажите корректный номер телефона']),
    );
  });

  it('honeypot даёт 201 со статусом SPAM — боту не подсказываем', async () => {
    const res = await request(app.getHttpServer())
      .post(`${base}/public/leads`)
      .field('name', 'Бот Ботов')
      .field('phone', '+77001112233')
      .field('consent', 'true')
      .field('companyWebsite', 'http://spam.example')
      .expect(201);
    expect(res.body.status).toBe('SPAM');
  });

  it('отправка быстрее двух секунд помечается спамом', async () => {
    const res = await request(app.getHttpServer())
      .post(`${base}/public/leads`)
      .field('name', 'Быстрый Скрипт')
      .field('phone', '+77002223344')
      .field('consent', 'true')
      .field('renderedAt', String(Date.now()))
      .expect(201);
    expect(res.body.status).toBe('SPAM');
  });

  it('отвергает недопустимое расширение', async () => {
    await request(app.getHttpServer())
      .post(`${base}/public/leads`)
      .field('name', 'Тест Тестов')
      .field('phone', '+77003334455')
      .field('consent', 'true')
      .attach('attachment', Buffer.from('MZ\x90\x00'), 'virus.exe')
      .expect(400);
  });

  it('отвергает подмену расширения: PDF, названный .jpg', async () => {
    const res = await request(app.getHttpServer())
      .post(`${base}/public/leads`)
      .field('name', 'Тест Тестов')
      .field('phone', '+77004445566')
      .field('consent', 'true')
      .attach('attachment', PDF, 'maskirovka.jpg')
      .expect(400);
    expect(res.body.message).toMatch(/не соответствует/);
  });

  it('заявка-сирота не создаётся, если файл отклонён', async () => {
    const before = await prisma.lead.count();
    await request(app.getHttpServer())
      .post(`${base}/public/leads`)
      .field('name', 'Сирота Сиротов')
      .field('phone', '+77006667788')
      .field('consent', 'true')
      .attach('attachment', PDF, 'podmena.jpg')
      .expect(400);
    expect(await prisma.lead.count()).toBe(before);
  });

  it('инбокс закрыт без токена', async () => {
    await request(app.getHttpServer()).get(`${base}/admin/leads`).expect(401);
  });

  it('инбокс ищет по цифрам телефона', async () => {
    const res = await request(app.getHttpServer())
      .get(`${base}/admin/leads?q=7072671237`)
      .set(auth())
      .expect(200);
    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0].name).toBe('Дмитрий');
  });

  it('вложение скачивается только под авторизацией', async () => {
    const lead = await prisma.lead.findFirstOrThrow({
      where: { attachments: { some: {} } },
      include: { attachments: true },
    });
    const url = `${base}/admin/leads/${lead.id}/attachments/${lead.attachments[0].id}`;

    await request(app.getHttpServer()).get(url).expect(401);

    const res = await request(app.getHttpServer()).get(url).set(auth()).expect(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.body).toEqual(PDF);
  });

  it('недопустимый переход статуса отклоняется', async () => {
    const lead = await prisma.lead.findFirstOrThrow({ where: { status: 'NEW' } });

    await request(app.getHttpServer())
      .patch(`${base}/admin/leads/${lead.id}`)
      .set(auth())
      .send({ status: 'DONE' })
      .expect(200);

    const res = await request(app.getHttpServer())
      .patch(`${base}/admin/leads/${lead.id}`)
      .set(auth())
      .send({ status: 'NEW' })
      .expect(400);
    expect(res.body.message).toMatch(/Нельзя перевести/);
  });

  it('заявки без уведомления остаются находимыми по notifiedAt', async () => {
    // Telegram в тестах не настроен, поэтому notifiedAt пустой — именно это
    // и делает недоставленные уведомления отслеживаемыми.
    const pending = await prisma.lead.count({ where: { notifiedAt: null } });
    expect(pending).toBeGreaterThan(0);
  });
});
