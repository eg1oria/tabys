import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthUser } from '../../auth/types.js';

type AuditEntry = {
  actor?: AuthUser;
  action: string;
  entity: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
};

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Запись в журнал не должна ронять саму операцию: если админ успешно
   * сохранил категорию, упавший аудит — повод для лога, а не для 500.
   */
  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: entry.actor?.id,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId,
          before: entry.before === undefined ? undefined : JSON.parse(JSON.stringify(entry.before)),
          after: entry.after === undefined ? undefined : JSON.parse(JSON.stringify(entry.after)),
          ip: entry.ip,
        },
      });
    } catch (error) {
      this.logger.error(
        `Не удалось записать аудит ${entry.action}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
