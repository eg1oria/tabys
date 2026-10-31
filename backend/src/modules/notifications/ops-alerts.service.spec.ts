import { OpsAlerts } from './ops-alerts.service.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import type { ServerErrorEvent } from '../../common/filters/all-exceptions.filter.js';

function prismaStub() {
  return {
    isDatabaseReachable: vi.fn(),
    telegramBot: { findUnique: vi.fn().mockResolvedValue({ token: '1:T' }) },
    telegramChat: { findMany: vi.fn().mockResolvedValue([{ chatId: '42' }]) },
  };
}

const event: ServerErrorEvent = {
  requestId: 'req-1',
  method: 'GET',
  route: '/api/v1/admin/products/:id',
  error: 'TypeError: <boom>',
};

describe('OpsAlerts', () => {
  let prisma: ReturnType<typeof prismaStub>;
  let alerts: OpsAlerts;
  let sent: { chat_id: string; text: string }[];

  beforeEach(() => {
    sent = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      sent.push(
        JSON.parse(init?.body as string) as { chat_id: string; text: string },
      );
      return Response.json({ ok: true, result: {} });
    });
    prisma = prismaStub();
    alerts = new OpsAlerts(prisma as unknown as PrismaService);
  });

  afterEach(() => vi.restoreAllMocks());

  it('шлёт 500-ю только в чаты владельцев и экранирует текст ошибки', async () => {
    await alerts.handleServerError(event);

    expect(prisma.telegramChat.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { addedBy: { role: 'OWNER', isActive: true } },
      }),
    );
    expect(sent).toHaveLength(1);
    expect(sent[0].chat_id).toBe('42');
    expect(sent[0].text).toContain('TypeError: &lt;boom&gt;');
  });

  it('ту же ошибку на том же маршруте повторно не шлёт', async () => {
    await alerts.handleServerError(event);
    await alerts.handleServerError({ ...event, requestId: 'req-2' });
    await alerts.handleServerError({ ...event, route: '/api/v1/admin/leads' });
    expect(sent).toHaveLength(2);
  });

  it('о лежащей базе сообщает со второй неудачи — получателей берёт из памяти', async () => {
    prisma.isDatabaseReachable.mockResolvedValue(true);
    await alerts.checkDatabase();
    // Получатели запомнились при первом удачном чтении.
    await alerts.handleServerError(event);
    sent = [];

    prisma.isDatabaseReachable.mockResolvedValue(false);
    prisma.telegramBot.findUnique.mockRejectedValue(new Error('db down'));
    prisma.telegramChat.findMany.mockRejectedValue(new Error('db down'));

    await alerts.checkDatabase();
    expect(sent).toHaveLength(0);
    await alerts.checkDatabase();
    await alerts.checkDatabase();
    expect(sent).toHaveLength(1);
    expect(sent[0].text).toMatch(/База данных недоступна/);

    prisma.isDatabaseReachable.mockResolvedValue(true);
    await alerts.checkDatabase();
    expect(sent).toHaveLength(2);
    expect(sent[1].text).toMatch(/снова доступна/);
  });
});
