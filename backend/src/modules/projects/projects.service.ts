import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AppConfigService } from '../../config/app-config.service.js';
import { AuditService } from '../../common/audit/audit.service.js';
import { prismaCode } from '../../common/filters/all-exceptions.filter.js';
import { PublishStatus } from '../../prisma/client.js';
import type { AuthUser } from '../../auth/types.js';
import type { ReorderItemDto } from '../categories/dto/reorder.dto.js';
import type { CreateProjectDto, UpdateProjectDto } from './dto/project.dto.js';

const IMAGE_SELECT = {
  storageKey: true,
  alt: true,
  width: true,
  height: true,
  blurDataUrl: true,
} as const;

const ORDER = [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }];

/** Поля DTO → данные записи; пункты списка без пустых строк. */
function toData(dto: UpdateProjectDto) {
  return {
    title: dto.title,
    subtitle: dto.subtitle,
    location: dto.location,
    year: dto.year,
    scope: dto.scope?.map((item) => item.trim()).filter(Boolean),
    imageId: dto.imageId,
    status: dto.status,
  };
}

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly audit: AuditService,
  ) {}

  // ───────────────────────── публичное ─────────────────────────

  /** Форма ответа повторяет тип PublicProject на фронтенде. */
  async findAllPublic() {
    const rows = await this.prisma.project.findMany({
      where: { status: PublishStatus.PUBLISHED },
      orderBy: ORDER,
      select: {
        id: true,
        title: true,
        subtitle: true,
        location: true,
        year: true,
        scope: true,
        image: { select: IMAGE_SELECT },
      },
    });

    return rows.map(({ image, ...row }) => ({
      ...row,
      image: image
        ? {
            url: `${this.config.publicUrl}/uploads/${image.storageKey}`,
            alt: image.alt,
            width: image.width,
            height: image.height,
            blurDataUrl: image.blurDataUrl,
          }
        : null,
    }));
  }

  // ───────────────────────── админское ─────────────────────────

  /** Проектов единицы — список целиком, без страниц. */
  findAllAdmin() {
    return this.prisma.project.findMany({
      orderBy: ORDER,
      include: { image: { select: IMAGE_SELECT } },
    });
  }

  async findOneAdmin(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { image: { select: IMAGE_SELECT } },
    });
    if (!project) throw new NotFoundException('Проект не найден');
    return project;
  }

  async create(dto: CreateProjectDto, actor: AuthUser) {
    // Новый — в конец списка: на сайте он не должен вставать первым сам.
    const last = await this.prisma.project.aggregate({
      _max: { sortOrder: true },
    });
    const created = await this.withImageCheck(() =>
      this.prisma.project.create({
        data: {
          ...toData(dto),
          title: dto.title,
          scope: toData(dto).scope ?? [],
          sortOrder: (last._max.sortOrder ?? -1) + 1,
        },
        include: { image: { select: IMAGE_SELECT } },
      }),
    );

    await this.audit.log({
      actor,
      action: 'project.create',
      entity: 'Project',
      entityId: created.id,
      after: created,
    });
    return created;
  }

  async update(id: string, dto: UpdateProjectDto, actor: AuthUser) {
    const before = await this.findOneAdmin(id);
    const updated = await this.withImageCheck(() =>
      this.prisma.project.update({
        where: { id },
        data: toData(dto),
        include: { image: { select: IMAGE_SELECT } },
      }),
    );

    const statusChanged =
      dto.status !== undefined && dto.status !== before.status;
    await this.audit.log({
      actor,
      action: statusChanged
        ? dto.status === PublishStatus.PUBLISHED
          ? 'project.publish'
          : 'project.unpublish'
        : 'project.update',
      entity: 'Project',
      entityId: id,
      before,
      after: updated,
    });
    return updated;
  }

  async reorder(items: ReorderItemDto[], actor: AuthUser): Promise<void> {
    await this.prisma.$transaction(
      items.map(({ id, sortOrder }) =>
        this.prisma.project.update({ where: { id }, data: { sortOrder } }),
      ),
    );
    await this.audit.log({
      actor,
      action: 'project.reorder',
      entity: 'Project',
      after: { order: items.map((i) => i.id) },
    });
  }

  async remove(id: string, actor: AuthUser): Promise<void> {
    const before = await this.findOneAdmin(id);
    await this.prisma.project.delete({ where: { id } });
    await this.audit.log({
      actor,
      action: 'project.delete',
      entity: 'Project',
      entityId: id,
      before,
    });
  }

  /** Несуществующий imageId база отвергает по внешнему ключу (P2003). */
  private async withImageCheck<T>(write: () => Promise<T>): Promise<T> {
    try {
      return await write();
    } catch (error) {
      if (prismaCode(error) === 'P2003') {
        throw new BadRequestException(
          'imageId: такой картинки нет в медиатеке',
        );
      }
      throw error;
    }
  }
}
