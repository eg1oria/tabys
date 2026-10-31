import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { readdir, stat, unlink } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AppConfigService } from '../../config/app-config.service.js';
import { resolveWithin } from '../media/storage.js';

const DAY_MS = 24 * 60 * 60_000;
/** Первый проход — не сразу: на старте и так хватает работы. */
const FIRST_RUN_AFTER_MS = 10 * 60_000;
/**
 * Файл моложе суток не трогаем: загрузка пишет файлы раньше строки в базе,
 * и свежий «сирота» может оказаться загрузкой, которая ещё идёт.
 */
const ORPHAN_MIN_AGE_MS = DAY_MS;
/**
 * Предохранитель: если «лишними» вышла бо́льшая часть файлов, скорее
 * ошиблась конфигурация (бэкенд смотрит не в ту базу или не в тот том),
 * чем действительно накопился мусор. Тогда не удаляем ничего.
 */
const MAX_ORPHAN_SHARE = 0.5;
const ORPHAN_SHARE_FLOOR = 20;

export type HousekeepingReport = {
  refreshTokens: number;
  linkCodes: number;
  auditLogs: number;
  orphanFiles: number;
  /** Почему файлы не чистились, если не чистились. */
  filesSkipped?: string;
};

/**
 * Ежесуточная уборка того, что иначе копится вечно: истёкшие refresh-токены
 * и коды подключения Telegram, старый журнал действий и файлы в UPLOAD_DIR,
 * на которые не ссылается ни одна запись.
 *
 * Таймер, а не @nestjs/schedule — как в LeadNotifier. Экземпляр бэкенда
 * один (README, «Файлы»), так что двойного прохода не бывает.
 */
@Injectable()
export class Housekeeping implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(Housekeeping.name);
  private timers: NodeJS.Timeout[] = [];
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  onApplicationBootstrap(): void {
    const first = setTimeout(() => {
      void this.runSafely();
      const daily = setInterval(() => void this.runSafely(), DAY_MS);
      daily.unref();
      this.timers.push(daily);
    }, FIRST_RUN_AFTER_MS);
    first.unref();
    this.timers.push(first);
  }

  onModuleDestroy(): void {
    for (const timer of this.timers) clearTimeout(timer);
  }

  private async runSafely(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const report = await this.run();
      this.logger.log(`Уборка: ${JSON.stringify(report)}`);
    } catch (error) {
      this.logger.error(
        'Уборка не удалась',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.running = false;
    }
  }

  async run(now = new Date()): Promise<HousekeepingReport> {
    // Истёкший refresh-токен не примет rotate() — ни как действующий, ни
    // как повтор (проверка срока идёт раньше проверки на повтор), так что
    // для обнаружения утечек он уже не нужен.
    const refreshTokens = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: now } },
    });
    const linkCodes = await this.prisma.telegramLinkCode.deleteMany({
      where: { expiresAt: { lt: now } },
    });

    let auditLogs = 0;
    const retentionDays = this.config.auditRetentionDays;
    if (retentionDays > 0) {
      ({ count: auditLogs } = await this.prisma.auditLog.deleteMany({
        where: {
          createdAt: { lt: new Date(now.getTime() - retentionDays * DAY_MS) },
        },
      }));
    }

    const files = await this.removeOrphanFiles(now);

    return {
      refreshTokens: refreshTokens.count,
      linkCodes: linkCodes.count,
      auditLogs,
      ...files,
    };
  }

  private async removeOrphanFiles(
    now: Date,
  ): Promise<Pick<HousekeepingReport, 'orphanFiles' | 'filesSkipped'>> {
    const root = this.config.uploadDir;
    const [media, attachments] = await Promise.all([
      this.prisma.mediaAsset.findMany({
        select: { storageKey: true, derivatives: true },
      }),
      this.prisma.leadAttachment.findMany({ select: { storageKey: true } }),
    ]);

    const known = new Set<string>();
    for (const asset of media) {
      known.add(asset.storageKey);
      const derivatives = (asset.derivatives ?? {}) as Record<string, string>;
      for (const key of Object.values(derivatives)) known.add(key);
    }
    for (const attachment of attachments) known.add(attachment.storageKey);

    const entries = await readdir(root, {
      recursive: true,
      withFileTypes: true,
    });
    const all = entries
      .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
      .map((entry) =>
        relative(root, join(entry.parentPath, entry.name)).split(sep).join('/'),
      );

    if (known.size === 0 && all.length > 0) {
      return { orphanFiles: 0, filesSkipped: 'в базе нет ни одного файла' };
    }

    const candidates = all.filter((key) => !known.has(key));
    if (
      candidates.length > ORPHAN_SHARE_FLOOR &&
      candidates.length > all.length * MAX_ORPHAN_SHARE
    ) {
      const reason = `лишними вышли ${candidates.length} из ${all.length} файлов — похоже на ошибку конфигурации`;
      this.logger.error(`Файлы не чистим: ${reason}`);
      return { orphanFiles: 0, filesSkipped: reason };
    }

    let orphanFiles = 0;
    for (const key of candidates) {
      const absolute = resolveWithin(root, key);
      try {
        const { mtimeMs } = await stat(absolute);
        if (now.getTime() - mtimeMs < ORPHAN_MIN_AGE_MS) continue;
        await unlink(absolute);
        orphanFiles += 1;
      } catch (error) {
        this.logger.warn(`Не удалось удалить ${key}: ${String(error)}`);
      }
    }
    return { orphanFiles };
  }
}
