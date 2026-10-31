import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LeadNotifier } from './lead-notifier.service.js';
import { LEAD_CREATED, type LeadCreatedEvent } from '../leads/leads.service.js';

@Injectable()
export class LeadNotificationListener {
  private readonly logger = new Logger(LeadNotificationListener.name);

  constructor(private readonly notifier: LeadNotifier) {}

  /**
   * Слушатель, а не вызов внутри create: ответ формы уходит сразу, а Telegram
   * может отвечать секунды или лежать. Неудачу подхватит повтор по таймеру
   * в LeadNotifier — пользователю её показывать нечего, заявка уже сохранена.
   */
  @OnEvent(LEAD_CREATED)
  async handleLeadCreated({ leadId }: LeadCreatedEvent): Promise<void> {
    try {
      await this.notifier.notify(leadId, null);
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
