import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TelegramService } from './telegram.service.js';
import { LeadsService, LEAD_CREATED, type LeadCreatedEvent } from '../leads/leads.service.js';

/** Экранирование под parse_mode: HTML — имя и сообщение пишет посторонний. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

@Injectable()
export class LeadNotificationListener {
  private readonly logger = new Logger(LeadNotificationListener.name);

  constructor(
    private readonly telegram: TelegramService,
    private readonly leads: LeadsService,
  ) {}

  /**
   * Слушатель, а не вызов внутри create: ответ формы уходит сразу, а Telegram
   * может отвечать секунды или лежать. Ошибка здесь остаётся в логе —
   * пользователю её показывать нечего, заявка уже сохранена.
   */
  @OnEvent(LEAD_CREATED)
  async handleLeadCreated({ leadId }: LeadCreatedEvent): Promise<void> {
    try {
      const lead = await this.leads.leadForNotification(leadId);
      if (!lead) return;

      const lines = [
        '<b>Новая заявка с сайта</b>',
        '',
        `<b>Имя:</b> ${escapeHtml(lead.name)}`,
        `<b>Телефон:</b> ${escapeHtml(lead.phone)}`,
      ];
      if (lead.email) lines.push(`<b>Email:</b> ${escapeHtml(lead.email)}`);
      if (lead.message) {
        lines.push('', '<b>Сообщение:</b>', escapeHtml(lead.message.slice(0, 2000)));
      }
      if (lead.attachments.length > 0) {
        lines.push(
          '',
          `<b>Вложение:</b> ${escapeHtml(lead.attachments[0].originalName)} ` +
            `(${Math.round(lead.attachments[0].bytes / 1024)} КБ)`,
        );
      }
      lines.push('', `Заявка ${lead.id}`);

      const sent = await this.telegram.sendMessage(lines.join('\n'));
      if (sent) await this.leads.markNotified(leadId);
    } catch (error) {
      // Промис обязан быть обработан здесь: no-floating-promises в oxlint
      // включён как error, и это правило здесь по делу.
      this.logger.error(
        `Не удалось уведомить о заявке ${leadId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
