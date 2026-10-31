import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditService } from '../../common/audit/audit.service.js';
import { LeadStatus } from '../../prisma/client.js';
import type { AuthUser } from '../../auth/types.js';
import {
  callTelegram,
  type TelegramChatInfo,
  type TelegramUpdate,
  type TelegramUser,
} from './telegram.api.js';

const BOT_ID = 1;
const LINK_TTL_MS = 10 * 60_000;

/** «/start <код>» в личке и «/start@bot <код>» в группе. */
const START_COMMAND = /^\/start(?:@\w+)?\s+([\w-]+)\s*$/;

export type SendResult = 'not_configured' | 'delivered' | 'failed';

/** Id бота — часть токена до двоеточия: по ней видно, тот же это бот или другой. */
function botIdOf(token: string): string {
  return token.split(':')[0];
}

function chatTitle(chat: TelegramChatInfo): string {
  if (chat.title) return chat.title;
  const name = [chat.first_name, chat.last_name].filter(Boolean).join(' ');
  if (name && chat.username) return `${name} (@${chat.username})`;
  return name || (chat.username ? `@${chat.username}` : String(chat.id));
}

/**
 * Бот заказчика и чаты менеджеров — в базе, а не в окружении: заказчик
 * подключает Telegram сам из админки, без правки .env и перезапуска.
 */
@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async configured(): Promise<boolean> {
    const [bot, chats] = await Promise.all([
      this.prisma.telegramBot.count(),
      this.prisma.telegramChat.count(),
    ]);
    return bot > 0 && chats > 0;
  }

  /** Состояние для админки. Токен наружу не уходит никогда — только username. */
  async status() {
    const [bot, chats, pendingLeads] = await Promise.all([
      this.prisma.telegramBot.findUnique({
        where: { id: BOT_ID },
        select: { username: true, updatedAt: true },
      }),
      this.prisma.telegramChat.findMany({
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          title: true,
          lastError: true,
          lastErrorAt: true,
          createdAt: true,
          addedBy: { select: { name: true } },
        },
      }),
      this.prisma.lead.count({
        where: { status: LeadStatus.NEW, notifiedAt: null },
      }),
    ]);

    return {
      bot: bot ? { ...bot, url: `https://t.me/${bot.username}` } : null,
      chats,
      pendingLeads,
    };
  }

  async setToken(token: string, actor: AuthUser) {
    const me = await callTelegram<TelegramUser>(token, 'getMe');
    if (!me.ok) {
      if (me.status === 401 || me.status === 404) {
        throw new BadRequestException(
          'Telegram не принял токен — скопируйте его из @BotFather целиком',
        );
      }
      throw new ServiceUnavailableException(
        'Telegram сейчас недоступен — попробуйте ещё раз через минуту',
      );
    }
    if (!me.result.username) {
      throw new BadRequestException(
        'У бота нет username — это не бот из @BotFather',
      );
    }

    // Подключение чатов читает getUpdates, а при заданном вебхуке Telegram
    // отвечает на него 409. Бот нужен только сайту, так что вебхук снимаем.
    await callTelegram(token, 'deleteWebhook');

    const before = await this.prisma.telegramBot.findUnique({
      where: { id: BOT_ID },
    });
    const sameBot = before !== null && botIdOf(before.token) === botIdOf(token);

    await this.prisma.$transaction(async (tx) => {
      // Другой бот не может писать тем, кто его не запускал: старые чаты
      // и коды подключения ему бесполезны.
      if (!sameBot) {
        await tx.telegramChat.deleteMany();
        await tx.telegramLinkCode.deleteMany();
      }
      await tx.telegramBot.upsert({
        where: { id: BOT_ID },
        create: { id: BOT_ID, token, username: me.result.username! },
        update: {
          token,
          username: me.result.username!,
          ...(sameBot ? {} : { updatesOffset: 0 }),
        },
      });
    });

    await this.audit.log({
      actor,
      action: 'telegram.bot.set',
      entity: 'TelegramBot',
      before: before ? { username: before.username } : undefined,
      after: { username: me.result.username, chatsKept: sameBot },
    });

    return this.status();
  }

  async removeBot(actor: AuthUser): Promise<void> {
    const before = await this.prisma.telegramBot.findUnique({
      where: { id: BOT_ID },
    });
    if (!before) return;

    await this.prisma.$transaction([
      this.prisma.telegramChat.deleteMany(),
      this.prisma.telegramLinkCode.deleteMany(),
      this.prisma.telegramBot.delete({ where: { id: BOT_ID } }),
    ]);

    await this.audit.log({
      actor,
      action: 'telegram.bot.remove',
      entity: 'TelegramBot',
      before: { username: before.username },
    });
  }

  /** Одноразовая ссылка t.me/<бот>?start=<код> — по ней менеджер подключает свой чат. */
  async createLink(actor: AuthUser) {
    const bot = await this.requireBot();
    await this.prisma.telegramLinkCode.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    const code = randomBytes(16).toString('base64url');
    const { expiresAt } = await this.prisma.telegramLinkCode.create({
      data: {
        code,
        createdById: actor.id,
        expiresAt: new Date(Date.now() + LINK_TTL_MS),
      },
    });

    return {
      code,
      url: `https://t.me/${bot.username}?start=${code}`,
      groupUrl: `https://t.me/${bot.username}?startgroup=${code}`,
      expiresAt,
    };
  }

  /**
   * Забирает новые сообщения бота и подключает чаты, приславшие действующий
   * код. Вебхук не нужен: админка опрашивает этот метод, пока ждёт нажатия
   * «Start», — сайту не приходится быть доступным для Telegram снаружи.
   */
  async checkLink(
    code: string,
    actor: AuthUser,
  ): Promise<{ connected: boolean; expired: boolean }> {
    const bot = await this.requireBot();
    const link = await this.prisma.telegramLinkCode.findUnique({
      where: { code },
    });
    // Кода нет — истёк или его уже погасил параллельный опрос: админка
    // перечитает список чатов и покажет, что получилось.
    if (!link || link.expiresAt < new Date()) {
      return { connected: false, expired: true };
    }

    const updates = await callTelegram<TelegramUpdate[]>(
      bot.token,
      'getUpdates',
      {
        offset: Number(bot.updatesOffset),
        timeout: 0,
        allowed_updates: ['message'],
      },
    );
    if (!updates.ok) {
      this.logger.warn(`getUpdates не удался: ${updates.description}`);
      if (updates.status === 409)
        await callTelegram(bot.token, 'deleteWebhook');
      return { connected: false, expired: false };
    }
    if (updates.result.length === 0)
      return { connected: false, expired: false };

    const starts = new Map<string, TelegramChatInfo>();
    for (const update of updates.result) {
      const match = update.message?.text?.match(START_COMMAND);
      if (match && update.message) starts.set(match[1], update.message.chat);
    }

    const valid = await this.prisma.telegramLinkCode.findMany({
      where: {
        code: { in: [...starts.keys()] },
        expiresAt: { gte: new Date() },
      },
    });

    let connected = false;
    for (const { code: used, createdById } of valid) {
      const chat = starts.get(used)!;
      const chatId = String(chat.id);
      await this.prisma.telegramChat.upsert({
        where: { chatId },
        create: { chatId, title: chatTitle(chat), addedById: createdById },
        update: { title: chatTitle(chat), lastError: null, lastErrorAt: null },
      });
      await this.prisma.telegramLinkCode.deleteMany({ where: { code: used } });
      await callTelegram(bot.token, 'sendMessage', {
        chat_id: chatId,
        text: 'Готово: сюда будут приходить заявки с сайта.',
      });
      await this.audit.log({
        actor,
        action: 'telegram.chat.add',
        entity: 'TelegramChat',
        entityId: chatId,
        after: { title: chatTitle(chat) },
      });
      if (used === code) connected = true;
    }

    // Прочитанные апдейты подтверждаем сдвигом offset — иначе Telegram
    // отдавал бы их снова при каждом опросе.
    const lastId = Math.max(...updates.result.map((u) => u.update_id));
    await this.prisma.telegramBot.update({
      where: { id: BOT_ID },
      data: { updatesOffset: BigInt(lastId) + 1n },
    });

    return { connected, expired: false };
  }

  async removeChat(id: string, actor: AuthUser): Promise<void> {
    const chat = await this.prisma.telegramChat.findUnique({ where: { id } });
    if (!chat) throw new NotFoundException('Чат не найден');
    await this.prisma.telegramChat.delete({ where: { id } });
    await this.audit.log({
      actor,
      action: 'telegram.chat.remove',
      entity: 'TelegramChat',
      entityId: chat.chatId,
      before: { title: chat.title },
    });
  }

  async sendTest(): Promise<{ delivered: boolean }> {
    const result = await this.send(
      'Проверка связи: уведомления о заявках с сайта приходят в этот чат.',
    );
    if (result === 'not_configured') {
      throw new BadRequestException(
        'Сначала подключите бота и хотя бы один чат',
      );
    }
    return { delivered: result === 'delivered' };
  }

  /**
   * Отправляет во все подключённые чаты. Ошибку возвращает значением, а не
   * исключением: уведомление не должно влиять на ответ формы. Отказ по
   * каждому чату запоминается — админка покажет, кто заблокировал бота.
   */
  async send(text: string): Promise<SendResult> {
    const [bot, chats] = await Promise.all([
      this.prisma.telegramBot.findUnique({ where: { id: BOT_ID } }),
      this.prisma.telegramChat.findMany(),
    ]);
    if (!bot || chats.length === 0) {
      this.logger.warn('Telegram не подключён — уведомление пропущено');
      return 'not_configured';
    }

    let delivered = 0;
    for (const chat of chats) {
      const res = await callTelegram(bot.token, 'sendMessage', {
        chat_id: chat.chatId,
        text,
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
      });

      if (res.ok) {
        delivered += 1;
        if (chat.lastError) {
          await this.prisma.telegramChat.update({
            where: { id: chat.id },
            data: { lastError: null, lastErrorAt: null },
          });
        }
      } else {
        this.logger.error(
          `Не доставлено в чат ${chat.chatId}: ${res.description}`,
        );
        await this.prisma.telegramChat.update({
          where: { id: chat.id },
          data: {
            lastError: res.description.slice(0, 300),
            lastErrorAt: new Date(),
          },
        });
      }
    }

    return delivered > 0 ? 'delivered' : 'failed';
  }

  private async requireBot() {
    const bot = await this.prisma.telegramBot.findUnique({
      where: { id: BOT_ID },
    });
    if (!bot) throw new BadRequestException('Сначала подключите бота');
    return bot;
  }
}
