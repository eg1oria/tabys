import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AppConfigService } from '../../config/app-config.service.js';
import { LeadStatus } from '../../prisma/client.js';
import { TelegramService } from './telegram.service.js';

const RETRY_EVERY_MS = 60_000;
/** Старше — уже не «новая заявка»: её видно в админке, а не в Telegram. */
const RETRY_WINDOW_MS = 3 * 24 * 60 * 60_000;
const RETRY_BATCH = 100;
const MAX_BACKOFF_MIN = 60;

/** 1, 2, 4 … 60 минут: лежащий Telegram не долбим каждую минуту. */
export function retryDelayMs(attempts: number): number {
  return Math.min(2 ** Math.max(attempts - 1, 0), MAX_BACKOFF_MIN) * 60_000;
}

/** Экранирование под parse_mode: HTML — имя и сообщение пишет посторонний. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const RECEIVED_AT = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'Asia/Almaty',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * Доставка уведомлений о заявках. Первая попытка — сразу по событию,
 * остальные — по таймеру: раньше неудачная отправка терялась навсегда,
 * и менеджер о заявке не узнавал.
 */
@Injectable()
export class LeadNotifier implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(LeadNotifier.name);
  private timer?: NodeJS.Timeout;
  private retrying = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly telegram: TelegramService,
  ) {}

  // Таймер, а не @nestjs/schedule: ради одного setInterval зависимость
  // не нужна.
  onApplicationBootstrap(): void {
    this.timer = setInterval(() => void this.retryPending(), RETRY_EVERY_MS);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    clearInterval(this.timer);
  }

  /**
   * Одна попытка уведомить. `previousAttemptAt` — что мы видели в заявке:
   * попытку «захватывает» UPDATE с этим условием, поэтому слушатель и
   * ретрай не отправят одну заявку дважды. true — уведомление доставлено.
   */
  async notify(
    leadId: string,
    previousAttemptAt: Date | null,
  ): Promise<boolean> {
    // Пока Telegram не подключён, попытки не тратим: подключат — заявки
    // последних дней дойдут сами.
    if (!(await this.telegram.configured())) return false;

    const { count } = await this.prisma.lead.updateMany({
      where: {
        id: leadId,
        status: LeadStatus.NEW,
        notifiedAt: null,
        notifyAttemptAt: previousAttemptAt,
      },
      data: { notifyAttemptAt: new Date(), notifyAttempts: { increment: 1 } },
    });
    if (count === 0) return false;

    const lead = await this.prisma.lead.findUniqueOrThrow({
      where: { id: leadId },
      include: { attachments: { select: { originalName: true, bytes: true } } },
    });

    const result = await this.telegram.send(this.message(lead));
    if (result === 'delivered') {
      await this.prisma.lead.update({
        where: { id: leadId },
        data: { notifiedAt: new Date() },
      });
      return true;
    }

    this.logger.warn(
      `Заявка ${leadId}: уведомление не доставлено (попытка ${lead.notifyAttempts}), повторим`,
    );
    return false;
  }

  /** Повторяет недоставленные уведомления по новым заявкам последних дней. */
  async retryPending(): Promise<void> {
    if (this.retrying) return;
    this.retrying = true;
    try {
      if (!(await this.telegram.configured())) return;

      const now = Date.now();
      const pending = await this.prisma.lead.findMany({
        where: {
          status: LeadStatus.NEW,
          notifiedAt: null,
          createdAt: { gte: new Date(now - RETRY_WINDOW_MS) },
        },
        orderBy: { createdAt: 'asc' },
        take: RETRY_BATCH,
        select: { id: true, notifyAttempts: true, notifyAttemptAt: true },
      });

      for (const lead of pending) {
        const due =
          !lead.notifyAttemptAt ||
          now - lead.notifyAttemptAt.getTime() >=
            retryDelayMs(lead.notifyAttempts);
        if (due) await this.notify(lead.id, lead.notifyAttemptAt);
      }
    } catch (error) {
      this.logger.error(
        'Повтор уведомлений о заявках упал',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.retrying = false;
    }
  }

  private message(lead: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    message: string | null;
    createdAt: Date;
    attachments: { originalName: string; bytes: number }[];
  }): string {
    const lines = [
      '<b>Новая заявка с сайта</b>',
      '',
      `<b>Имя:</b> ${escapeHtml(lead.name)}`,
      `<b>Телефон:</b> ${escapeHtml(lead.phone)}`,
    ];
    if (lead.email) lines.push(`<b>Email:</b> ${escapeHtml(lead.email)}`);
    if (lead.message) {
      lines.push(
        '',
        '<b>Сообщение:</b>',
        escapeHtml(lead.message.slice(0, 2000)),
      );
    }
    if (lead.attachments.length > 0) {
      lines.push(
        '',
        `<b>Вложение:</b> ${escapeHtml(lead.attachments[0].originalName)} ` +
          `(${Math.round(lead.attachments[0].bytes / 1024)} КБ)`,
      );
    }
    // Время — потому что уведомление могло дойти с ретраем, спустя часы.
    lines.push('', `Получена: ${RECEIVED_AT.format(lead.createdAt)}`);
    // В проде PUBLIC_URL — домен сайта, где живёт и админка; локально это
    // адрес бэкенда, и ссылка вела бы в никуда.
    lines.push(
      this.config.isProduction
        ? `${this.config.publicUrl}/admin/leads/${lead.id}`
        : `Заявка ${lead.id}`,
    );
    return lines.join('\n');
  }
}
