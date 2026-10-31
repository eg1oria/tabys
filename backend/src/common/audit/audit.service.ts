import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { paginate, type Paginated } from '../dto/pagination.dto.js';
import type { Prisma } from '../../prisma/client.js';
import type { AuthUser } from '../../auth/types.js';
import type { QueryAuditDto } from './dto/query-audit.dto.js';

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

  /**
   * Новые сверху; id — второй ключ, чтобы записи одной миллисекунды не
   * прыгали между страницами. Автор — имя и email: удалённого
   * администратора тут не будет (actorId обнуляется), запись останется.
   */
  async findAll(dto: QueryAuditDto): Promise<Paginated<unknown>> {
    const where: Prisma.AuditLogWhereInput = {
      ...(dto.entity ? { entity: dto.entity } : {}),
      ...(dto.entityId ? { entityId: dto.entityId } : {}),
      ...(dto.actorId ? { actorId: dto.actorId } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: dto.skip,
        take: dto.perPage,
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          before: true,
          after: true,
          ip: true,
          createdAt: true,
          actor: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return paginate(rows, total, dto);
  }
}
