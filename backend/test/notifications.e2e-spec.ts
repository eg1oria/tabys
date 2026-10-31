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
import { LeadNotifier } from '../src/modules/notifications/lead-notifier.service.js';

const TOKEN = '123456789:AAHfakeTokenForE2eTestsOnly_abcdefgh';
const EDITOR_EMAIL = 'e2e-editor@tabys.kz';

/**
 * Поддельный Bot API: настоящий Telegram в тестах недоступен и не нужен.
 * Подменяется глобальный fetch — им и пользуется telegram.api.ts.
 */
class FakeTelegram {
  sendFails = false;
  updates: unknown[] = [];
  sent: { chat_id: string; text: string }[] = [];

  handle = async (
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> => {
    const url = input instanceof Request ? input.url : input.toString();
    const method = url.split('/').pop();
    const token = url.split('/bot')[1]?.split('/')[0];
    const body = JSON.parse(
      typeof init?.body === 'string' ? init.body : '{}',
    ) as Record<string, unknown>;
    const ok = (result: unknown) => Response.json({ ok: true, result });

    if (token !== TOKEN) {
      return Response.json(
        { ok: false, description: 'Unauthorized' },
        { status: 401 },
      );
    }
    switch (method) {
      case 'getMe':
        return ok({
          id: 123456789,
          username: 'tabys_test_bot',
          first_name: 'Tabys',
        });
      case 'deleteWebhook':
        return ok(true);
      case 'getUpdates': {
        const offset = Number(body.offset ?? 0);
        return ok(
          this.updates.filter(
            (u) => (u as { update_id: number }).update_id >= offset,
          ),
        );
      }
      case 'sendMessage':
        if (this.sendFails) {
          return Response.json(
            { ok: false, description: 'Bad Gateway' },
            { status: 502 },
          );
        }
        this.sent.push({
          chat_id: String(body.chat_id),
          text: String(body.text),
        });
        return ok({ message_id: this.sent.length });
      default:
        return Response.json(
          { ok: false, description: 'Not Found' },
          { status: 404 },
        );
    }
  };
}

describe('Уведомления о заявках (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let notifier: LeadNotifier;
  let owner: string;
  let editor: string;
  const telegram = new FakeTelegram();
  const base = '/api/v1';

  const login = async (email: string) => {
    const res = await request(app.getHttpServer())
      .post(`${base}/auth/login`)
      .send({ email, password: ADMIN_PASSWORD })
      .expect(200);
    return res.body.accessToken as string;
  };
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });
  const newLead = (data: { createdAt?: Date } = {}) =>
    prisma.lead.create({
      data: {
        name: 'Покупатель',
        phone: '+7 (707) 000-00-00',
        phoneDigits: '77070000000',
        consentAt: new Date(),
        ...data,
      },
    });

  beforeAll(async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(telegram.handle);
    app = await createTestApp();
    prisma = app.get(PrismaService);
    notifier = app.get(LeadNotifier);
    await truncateAll(prisma);

    const passwordHash = await app.get(PasswordService).hash(ADMIN_PASSWORD);
    await prisma.adminUser.createMany({
      data: [
        { email: ADMIN_EMAIL, name: 'Владелец', role: 'OWNER', passwordHash },
        { email: EDITOR_EMAIL, name: 'Менеджер', role: 'EDITOR', passwordHash },
      ],
    });
    owner = await login(ADMIN_EMAIL);
    editor = await login(EDITOR_EMAIL);
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await truncateAll(prisma);
    await app?.close();
  });

  it('пока бот не подключён, ретрай не тратит попытки', async () => {
    const lead = await newLead();
    await notifier.retryPending();
    const after = await prisma.lead.findUniqueOrThrow({
      where: { id: lead.id },
    });
    expect(after.notifyAttempts).toBe(0);
    expect(after.notifiedAt).toBeNull();
  });

  it('токен меняет только владелец', async () => {
    await request(app.getHttpServer())
      .put(`${base}/admin/notifications/telegram/bot`)
      .set(as(editor))
      .send({ token: TOKEN })
      .expect(403);
  });

  it('токен, который Telegram не принял, — 400', async () => {
    const res = await request(app.getHttpServer())
      .put(`${base}/admin/notifications/telegram/bot`)
      .set(as(owner))
      .send({ token: '999999999:AAHsomeOtherTokenThatTelegramRejects' })
      .expect(400);
    expect(res.body.message).toMatch(/не принял токен/);
  });

  it('подключённый бот виден по username, а токен наружу не уходит', async () => {
    await request(app.getHttpServer())
      .put(`${base}/admin/notifications/telegram/bot`)
      .set(as(owner))
      .send({ token: ` ${TOKEN} ` })
      .expect(200);

    const res = await request(app.getHttpServer())
      .get(`${base}/admin/notifications/telegram`)
      .set(as(editor))
      .expect(200);
    expect(res.body.bot.username).toBe('tabys_test_bot');
    expect(JSON.stringify(res.body)).not.toContain(TOKEN);
  });

  it('менеджер подключает свой чат по ссылке с кодом', async () => {
    const link = await request(app.getHttpServer())
      .post(`${base}/admin/notifications/telegram/link`)
      .set(as(editor))
      .expect(201);
    expect(link.body.url).toBe(
      `https://t.me/tabys_test_bot?start=${link.body.code}`,
    );

    const check = () =>
      request(app.getHttpServer())
        .post(
          `${base}/admin/notifications/telegram/link/${link.body.code}/check`,
        )
        .set(as(editor))
        .expect(200);

    // Чужой код и посторонние сообщения чат не подключают.
    telegram.updates = [
      {
        update_id: 10,
        message: { text: '/start чужой-код', chat: { id: 1, type: 'private' } },
      },
      {
        update_id: 11,
        message: { text: 'привет', chat: { id: 2, type: 'private' } },
      },
    ];
    expect((await check()).body).toEqual({ connected: false, expired: false });
    expect(await prisma.telegramChat.count()).toBe(0);

    telegram.updates.push({
      update_id: 12,
      message: {
        text: `/start ${link.body.code}`,
        chat: {
          id: 555,
          type: 'private',
          first_name: 'Айгуль',
          username: 'aigul',
        },
      },
    });
    expect((await check()).body).toEqual({ connected: true, expired: false });

    const status = await request(app.getHttpServer())
      .get(`${base}/admin/notifications/telegram`)
      .set(as(editor))
      .expect(200);
    expect(status.body.chats).toHaveLength(1);
    expect(status.body.chats[0].title).toBe('Айгуль (@aigul)');
    // Код одноразовый.
    expect((await check()).body.expired).toBe(true);
  });

  it('заявка, о которой Telegram не уведомил, доходит повтором', async () => {
    // Заявки из первого теста к этому моменту тоже ждут уведомления.
    await prisma.lead.updateMany({ data: { notifiedAt: new Date() } });

    telegram.sendFails = true;
    const lead = await newLead();
    expect(await notifier.notify(lead.id, null)).toBe(false);

    let after = await prisma.lead.findUniqueOrThrow({ where: { id: lead.id } });
    expect(after.notifiedAt).toBeNull();
    expect(after.notifyAttempts).toBe(1);
    const chat = await prisma.telegramChat.findFirstOrThrow();
    expect(chat.lastError).toBe('Bad Gateway');

    // До конца паузы ретрай заявку не трогает.
    telegram.sendFails = false;
    await notifier.retryPending();
    after = await prisma.lead.findUniqueOrThrow({ where: { id: lead.id } });
    expect(after.notifyAttempts).toBe(1);

    await prisma.lead.update({
      where: { id: lead.id },
      data: { notifyAttemptAt: new Date(Date.now() - 2 * 60_000) },
    });
    await notifier.retryPending();
    after = await prisma.lead.findUniqueOrThrow({ where: { id: lead.id } });
    expect(after.notifiedAt).not.toBeNull();
    expect(after.notifyAttempts).toBe(2);
    expect((await prisma.telegramChat.findFirstOrThrow()).lastError).toBeNull();
    expect(telegram.sent.at(-1)?.text).toMatch(/Новая заявка с сайта/);
  });

  it('одну заявку не отправляют дважды: попытку захватывает только один', async () => {
    const lead = await newLead();
    const sentBefore = telegram.sent.length;
    const results = await Promise.all([
      notifier.notify(lead.id, null),
      notifier.notify(lead.id, null),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(telegram.sent.length - sentBefore).toBe(1);
  });

  it('заявка с сайта уведомляет сразу, через событие', async () => {
    const res = await request(app.getHttpServer())
      .post(`${base}/public/leads`)
      .field('name', 'Ерлан')
      .field('phone', '+7 (701) 111-22-33')
      .field('consent', 'true')
      .expect(201);

    await vi.waitFor(async () => {
      const lead = await prisma.lead.findUniqueOrThrow({
        where: { id: res.body.id },
      });
      expect(lead.notifiedAt).not.toBeNull();
    });
    expect(telegram.sent.at(-1)?.text).toContain('Ерлан');
  });

  it('старые заявки и заявки в работе ретрай не шлёт', async () => {
    const old = await newLead({
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60_000),
    });
    const taken = await newLead();
    await prisma.lead.update({
      where: { id: taken.id },
      data: { status: 'IN_PROGRESS' },
    });

    await notifier.retryPending();
    for (const id of [old.id, taken.id]) {
      const lead = await prisma.lead.findUniqueOrThrow({ where: { id } });
      expect(lead.notifyAttempts).toBe(0);
    }
  });

  it('список заявок фильтруется по notified, главная считает недошедшие', async () => {
    const unnotified = await request(app.getHttpServer())
      .get(`${base}/admin/leads?notified=false`)
      .set(as(owner))
      .expect(200);
    expect(
      unnotified.body.data.every(
        (l: { notifiedAt: unknown }) => l.notifiedAt === null,
      ),
    ).toBe(true);
    expect(unnotified.body.data.length).toBeGreaterThan(0);

    const stats = await request(app.getHttpServer())
      .get(`${base}/admin/stats`)
      .set(as(owner))
      .expect(200);
    // Старая заявка из прошлого теста — NEW без уведомления.
    expect(stats.body.notifications).toEqual({
      connected: true,
      pendingLeads: 1,
    });
  });

  it('смена бота отключает чаты: новый бот не может писать прежним', async () => {
    await prisma.telegramBot.update({
      where: { id: 1 },
      data: { token: '42:old' },
    });
    await request(app.getHttpServer())
      .put(`${base}/admin/notifications/telegram/bot`)
      .set(as(owner))
      .send({ token: TOKEN })
      .expect(200);
    expect(await prisma.telegramChat.count()).toBe(0);
  });
});
