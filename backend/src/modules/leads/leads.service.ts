import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createReadStream } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { dirname, extname } from 'node:path';
import { fileTypeFromBuffer } from 'file-type';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AppConfigService } from '../../config/app-config.service.js';
import { AuditService } from '../../common/audit/audit.service.js';
import { buildOrderBy } from '../../common/prisma/order-by.js';
import { paginate, type Paginated } from '../../common/dto/pagination.dto.js';
import {
  datePrefix,
  ensureDir,
  resolveWithin,
  safeFilename,
} from '../media/storage.js';
import { decodeMultipartFilename } from '../../common/http/multipart-filename.js';
import {
  ALLOWED_EXTENSIONS,
  EXTENSION_MIME,
  MAX_FILE_BYTES,
  SNIFF_EXEMPT,
} from './lead-file.constants.js';
import { LeadStatus, type Prisma } from '../../prisma/client.js';
import type { AuthUser } from '../../auth/types.js';
import type { CreateLeadDto } from './dto/create-lead.dto.js';
import type { QueryLeadsDto } from './dto/query-leads.dto.js';
import type { UpdateLeadDto } from './dto/update-lead.dto.js';

export const LEAD_CREATED = 'lead.created';

export type LeadCreatedEvent = { leadId: string };

type UploadedFile = { originalname: string; buffer: Buffer; size: number };

const SORTABLE = ['createdAt', 'updatedAt', 'name', 'status'] as const;

/** Из каких статусов куда можно двигаться. SPAM доступен всегда. */
const TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  NEW: [LeadStatus.IN_PROGRESS, LeadStatus.DONE, LeadStatus.SPAM],
  IN_PROGRESS: [LeadStatus.DONE, LeadStatus.NEW, LeadStatus.SPAM],
  DONE: [LeadStatus.IN_PROGRESS, LeadStatus.SPAM],
  SPAM: [LeadStatus.NEW],
};

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly audit: AuditService,
    private readonly events: EventEmitter2,
  ) {}

  private async validateAttachment(
    file: UploadedFile,
  ): Promise<{ ext: string; mimeType: string }> {
    if (file.size > MAX_FILE_BYTES) {
      throw new BadRequestException(
        'Файл больше 4 МБ — пришлите его на почту или в WhatsApp',
      );
    }

    const ext = extname(decodeMultipartFilename(file.originalname))
      .toLowerCase()
      .replace('.', '');
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException('Неподдерживаемый формат файла');
    }

    // Чертежи не имеют устойчивой сигнатуры — для них только расширение.
    if (SNIFF_EXEMPT.has(ext)) {
      return { ext, mimeType: 'application/octet-stream' };
    }

    const sniffed = await fileTypeFromBuffer(file.buffer);
    const expected = EXTENSION_MIME[ext];
    if (!sniffed || !expected?.includes(sniffed.mime)) {
      throw new BadRequestException(
        'Содержимое файла не соответствует его расширению',
      );
    }
    return { ext, mimeType: sniffed.mime };
  }

  async create(
    dto: CreateLeadDto,
    file: UploadedFile | undefined,
    ctx: { ip?: string; userAgent?: string },
  ): Promise<{ id: string; status: LeadStatus }> {
    // Проверяем файл ДО записи заявки: иначе на отказе останется запись-сирота.
    const checked = file ? await this.validateAttachment(file) : undefined;

    // Ботам отвечаем успехом: 400 только подсказывает, что менять.
    const status = dto.looksAutomated ? LeadStatus.SPAM : LeadStatus.NEW;
    if (status === LeadStatus.SPAM) {
      this.logger.warn(
        `Заявка помечена как спам (honeypot/таймер), ip=${ctx.ip}`,
      );
    }

    const lead = await this.prisma.lead.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        phoneDigits: dto.phoneDigits,
        email: dto.email,
        message: dto.message,
        status,
        consentAt: new Date(),
        ip: ctx.ip,
        userAgent: ctx.userAgent?.slice(0, 500),
      },
      select: { id: true, status: true },
    });

    if (file && checked) {
      const key = `leads/${datePrefix()}/${safeFilename(`x.${checked.ext}`)}`;
      const absolute = resolveWithin(this.config.uploadDir, key);
      await ensureDir(dirname(absolute));
      await writeFile(absolute, file.buffer);

      await this.prisma.leadAttachment.create({
        data: {
          leadId: lead.id,
          storageKey: key,
          originalName: decodeMultipartFilename(file.originalname).slice(
            0,
            255,
          ),
          mimeType: checked.mimeType,
          bytes: file.size,
        },
      });
    }

    // Уведомление — вне запроса: лежащий Telegram не должен подвешивать форму.
    if (status === LeadStatus.NEW) {
      this.events.emit(LEAD_CREATED, {
        leadId: lead.id,
      } satisfies LeadCreatedEvent);
    }

    return lead;
  }

  async findAll(dto: QueryLeadsDto): Promise<Paginated<unknown>> {
    const where: Prisma.LeadWhereInput = {
      ...(dto.status ? { status: dto.status } : {}),
      ...(dto.q
        ? {
            OR: [
              { name: { contains: dto.q, mode: 'insensitive' } },
              { email: { contains: dto.q, mode: 'insensitive' } },
              { phoneDigits: { contains: dto.q.replace(/\D/g, '') || dto.q } },
              { message: { contains: dto.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        orderBy: buildOrderBy(dto.sortBy, dto.order, SORTABLE, {
          createdAt: 'desc',
        }),
        skip: dto.skip,
        take: dto.perPage,
        include: {
          attachments: {
            select: {
              id: true,
              originalName: true,
              bytes: true,
              mimeType: true,
            },
          },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return paginate(rows, total, dto);
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        attachments: true,
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });
    if (!lead) throw new NotFoundException('Заявка не найдена');
    return lead;
  }

  async update(id: string, dto: UpdateLeadDto, actor: AuthUser) {
    const before = await this.findOne(id);

    if (dto.status && dto.status !== before.status) {
      const allowed = TRANSITIONS[before.status];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `Нельзя перевести заявку из ${before.status} в ${dto.status}`,
        );
      }
    }

    // Условие по исходному статусу прямо в UPDATE: между проверкой перехода
    // и записью заявку мог перевести другой администратор.
    const { count } = await this.prisma.lead.updateMany({
      where: { id, ...(dto.status ? { status: before.status } : {}) },
      data: {
        status: dto.status,
        internalNote: dto.internalNote,
        assignedToId: dto.assignedToId,
      },
    });
    if (count === 0) {
      throw new ConflictException(
        'Статус заявки уже изменили — обновите страницу',
      );
    }
    const updated = await this.prisma.lead.findUniqueOrThrow({ where: { id } });

    await this.audit.log({
      actor,
      action: 'lead.update',
      entity: 'Lead',
      entityId: id,
      before: { status: before.status, assignedToId: before.assignedToId },
      after: { status: updated.status, assignedToId: updated.assignedToId },
    });
    return updated;
  }

  /**
   * Вложения не раздаются статикой — только здесь, под авторизацией:
   * в них коммерческие чертежи и ТЗ заказчиков.
   */
  async attachmentStream(leadId: string, attachmentId: string) {
    const attachment = await this.prisma.leadAttachment.findFirst({
      where: { id: attachmentId, leadId },
    });
    if (!attachment) throw new NotFoundException('Вложение не найдено');

    const absolute = resolveWithin(
      this.config.uploadDir,
      attachment.storageKey,
    );
    return {
      stream: createReadStream(absolute),
      filename: attachment.originalName,
      bytes: attachment.bytes,
    };
  }

  async markNotified(leadId: string): Promise<void> {
    await this.prisma.lead.update({
      where: { id: leadId },
      data: { notifiedAt: new Date() },
    });
  }

  leadForNotification(leadId: string) {
    return this.prisma.lead.findUnique({
      where: { id: leadId },
      include: { attachments: { select: { originalName: true, bytes: true } } },
    });
  }
}
