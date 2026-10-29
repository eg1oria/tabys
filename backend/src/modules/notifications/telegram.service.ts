import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service.js';

const API = 'https://api.telegram.org';
const TIMEOUT_MS = 10_000;

/**
 * Отправка через встроенный fetch: нужен один POST к Bot API.
 * telegraf и nestjs-telegraf решают задачу диалоговых ботов — здесь это
 * лишняя зависимость.
 */
@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly config: AppConfigService) {}

  get configured(): boolean {
    return (
      Boolean(this.config.telegramBotToken) &&
      this.config.telegramChatIds.length > 0
    );
  }

  /**
   * Отправляет во все настроенные чаты. Ошибку возвращает флагом, а не
   * исключением: уведомление не должно влиять на ответ формы.
   */
  async sendMessage(text: string): Promise<boolean> {
    if (!this.configured) {
      this.logger.warn('Telegram не настроен — уведомление пропущено');
      return false;
    }

    const token = this.config.telegramBotToken;
    let delivered = 0;

    for (const chatId of this.config.telegramChatIds) {
      try {
        const res = await fetch(`${API}/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });

        if (res.ok) {
          delivered += 1;
        } else {
          // Тело ответа Telegram объясняет причину (неверный chat_id и пр.),
          // но токен в лог не попадает — он только в URL.
          this.logger.error(
            `Telegram отказал для чата ${chatId}: ${res.status} ${await res.text()}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Не доставлено в чат ${chatId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return delivered > 0;
  }
}
