import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AdminRole } from '../../prisma/client.js';
import {
  SERVER_ERROR,
  type ServerErrorEvent,
} from '../../common/filters/all-exceptions.filter.js';
import { callTelegram } from './telegram.api.js';

const BOT_ID = 1;
const DB_CHECK_EVERY_MS = 60_000;
/** Две неудачи подряд: разовый таймаут под нагрузкой — ещё не авария. */
const DB_FAILURES_TO_ALERT = 2;
/** Одна и та же ошибка на одном маршруте — не чаще раза в 15 минут. */
const REPEAT_AFTER_MS = 15 * 60_000;
/** Потолок на час: сломанный маршрут под ботом не должен заспамить чат. */
const MAX_PER_HOUR = 20;

type Recipients = { token: string; chatIds: string[] };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Технические алерты владельцу: 5xx бэкенда и недоступная база.
 *
 * Получатели — чаты, которые подключили владельцы (OWNER): менеджерам,
 * подключившим Telegram ради заявок, стектрейсы ни к чему. Бот и чаты
 * лежат в базе, поэтому последний удачный список держим в памяти: алерт
 * «база недоступна» иначе не смог бы узнать, куда слать.
 *
 * Падение самого бэкенда или всего сервера отсюда не увидеть — для этого
 * внешний опрос /api/health (README, «Мониторинг»).
 */
@Injectable()
export class OpsAlerts implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(OpsAlerts.name);
  private timer?: NodeJS.Timeout;
  private recipients: Recipients | null = null;
  private readonly lastSent = new Map<string, number>();
  private sentThisHour: number[] = [];
  private dbFailures = 0;
  private dbDownAlerted = false;

  constructor(private readonly prisma: PrismaService) {}

  onApplicationBootstrap(): void {
    void this.loadRecipients();
    this.timer = setInterval(
      () => void this.checkDatabase(),
      DB_CHECK_EVERY_MS,
    );
    this.timer.unref();
  }

  onModuleDestroy(): void {
    clearInterval(this.timer);
  }

  @OnEvent(SERVER_ERROR)
  async handleServerError(event: ServerErrorEvent): Promise<void> {
    const key = `${event.method} ${event.route} ${event.error}`;
    const now = Date.now();
    const last = this.lastSent.get(key);
    if (last !== undefined && now - last < REPEAT_AFTER_MS) return;
    this.lastSent.set(key, now);

    await this.alert(
      [
        '⚠️ <b>Ошибка 500 на сайте</b>',
        `${escapeHtml(event.method)} ${escapeHtml(event.route)}`,
        `<code>${escapeHtml(event.error.slice(0, 300))}</code>`,
        `requestId: <code>${event.requestId}</code> — подробности в логах бэкенда`,
      ].join('\n'),
    );
  }

  async checkDatabase(): Promise<void> {
    const up = await this.prisma.isDatabaseReachable();
    if (up) {
      this.dbFailures = 0;
      if (this.dbDownAlerted) {
        this.dbDownAlerted = false;
        await this.alert('✅ База данных снова доступна.');
      }
      return;
    }

    this.dbFailures += 1;
    if (this.dbFailures === DB_FAILURES_TO_ALERT) {
      this.dbDownAlerted = true;
      await this.alert(
        '🔴 <b>База данных недоступна</b>\nСайт не принимает заявки и не показывает каталог. ' +
          'Проверьте <code>docker compose ps</code> и логи <code>db</code>.',
      );
    }
  }

  private async alert(text: string): Promise<void> {
    const now = Date.now();
    this.sentThisHour = this.sentThisHour.filter((t) => now - t < 3_600_000);
    if (this.sentThisHour.length >= MAX_PER_HOUR) return;

    const recipients = await this.loadRecipients();
    if (!recipients || recipients.chatIds.length === 0) {
      this.logger.warn(
        'Некому отправить алерт: нет чатов, подключённых владельцем',
      );
      return;
    }
    this.sentThisHour.push(now);

    for (const chatId of recipients.chatIds) {
      const res = await callTelegram(recipients.token, 'sendMessage', {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
      });
      if (!res.ok) {
        this.logger.error(
          `Алерт не доставлен в чат ${chatId}: ${res.description}`,
        );
      }
    }
  }

  /** Свежий список из базы, а если она лежит — последний удачный. */
  private async loadRecipients(): Promise<Recipients | null> {
    try {
      const [bot, chats] = await Promise.all([
        this.prisma.telegramBot.findUnique({
          where: { id: BOT_ID },
          select: { token: true },
        }),
        this.prisma.telegramChat.findMany({
          where: { addedBy: { role: AdminRole.OWNER, isActive: true } },
          select: { chatId: true },
        }),
      ]);
      this.recipients = bot
        ? { token: bot.token, chatIds: chats.map((c) => c.chatId) }
        : null;
    } catch (error) {
      this.logger.warn(
        `Получатели алертов — из памяти: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    return this.recipients;
  }
}
