import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { unlink } from 'node:fs/promises';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AppConfigService } from '../../config/app-config.service.js';
import { AuditService } from '../../common/audit/audit.service.js';
import { paginate, type Paginated, type PaginationDto } from '../../common/dto/pagination.dto.js';
import { resolveWithin } from './storage.js';
import { sniffImage, storeImage } from './image-pipeline.js';
import type { AuthUser } from '../../auth/types.js';
import { decodeMultipartFilename } from '../../common/http/multipart-filename.js';
import { prismaCode } from '../../common/filters/all-exceptions.filter.js';

/** Где стоит картинка — словами, чтобы редактор знал, откуда её убирать. */
function usageDescription(count: {
  categories: number;
  products: number;
  productImages: number;
}): string {
  return [
    count.categories > 0 ? `обложки категорий: ${count.categories}` : '',
    count.products > 0 ? `обложки товаров: ${count.products}` : '',
    count.productImages > 0 ? `галереи товаров: ${count.productImages}` : '',
  ]
    .filter(Boolean)
    .join(', ');
}

function inUseMessage(usage: string): string {
  return `Изображение используется (${usage}) — сначала уберите его оттуда`;
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly audit: AuditService,
  ) {}

  private url(storageKey: string): string {
    return `${this.config.publicUrl}/uploads/${storageKey}`;
  }

  async upload(
    file: { originalname: string; buffer: Buffer; size: number },
    alt: string,
    actor: AuthUser,
  ) {
    const { image, detected } = await sniffImage(file.buffer);
    if (!image) {
      throw new BadRequestException(
        `Это не изображение (определён тип: ${detected ?? 'неизвестно'})`,
      );
    }

    const stored = await storeImage(file.buffer, image, this.config.uploadDir);
    const { storageKey, bytes, mimeType } = stored;

    const created = await this.prisma.mediaAsset.create({
      data: {
        ...stored,
        originalName: decodeMultipartFilename(file.originalname).slice(0, 255),
        alt,
        uploadedById: actor.id,
      },
    });

    await this.audit.log({
      actor,
      action: 'media.upload',
      entity: 'MediaAsset',
      entityId: created.id,
      after: { storageKey, bytes, mimeType },
    });

    return { ...created, url: this.url(created.storageKey) };
  }

  async findAll(dto: PaginationDto): Promise<Paginated<unknown>> {
    const [rows, total] = await Promise.all([
      this.prisma.mediaAsset.findMany({
        orderBy: { createdAt: 'desc' },
        skip: dto.skip,
        take: dto.perPage,
      }),
      this.prisma.mediaAsset.count(),
    ]);

    return paginate(
      rows.map((r) => ({ ...r, url: this.url(r.storageKey) })),
      total,
      dto,
    );
  }

  async updateAlt(id: string, alt: string, actor: AuthUser) {
    const before = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Файл не найден');

    const updated = await this.prisma.mediaAsset.update({ where: { id }, data: { alt } });

    await this.audit.log({
      actor,
      action: 'media.update',
      entity: 'MediaAsset',
      entityId: id,
      before: { alt: before.alt },
      after: { alt },
    });

    return { ...updated, url: this.url(updated.storageKey) };
  }

  async remove(id: string, actor: AuthUser): Promise<void> {
    const asset = await this.prisma.mediaAsset.findUnique({
      where: { id },
      include: {
        _count: { select: { categories: true, products: true, productImages: true } },
      },
    });
    if (!asset) throw new NotFoundException('Файл не найден');

    const usage = usageDescription(asset._count);
    if (usage) throw new BadRequestException(inUseMessage(usage));

    try {
      await this.prisma.mediaAsset.delete({ where: { id } });
    } catch (error) {
      // Галерея держит картинку через RESTRICT: если её добавили в товар
      // между проверкой и удалением, база откажет с P2003.
      if (prismaCode(error) === 'P2003') {
        throw new BadRequestException(inUseMessage('галерея товара'));
      }
      throw error;
    }

    // Файлы удаляем после записи в базе: осиротевший файл на диске —
    // мелочь, а запись без файла ломает выдачу.
    const keys = [
      asset.storageKey,
      ...Object.values((asset.derivatives ?? {}) as Record<string, string>),
    ];
    for (const key of keys) {
      try {
        await unlink(resolveWithin(this.config.uploadDir, key));
      } catch (error) {
        this.logger.warn(`Не удалось удалить файл ${key}: ${String(error)}`);
      }
    }

    await this.audit.log({
      actor,
      action: 'media.delete',
      entity: 'MediaAsset',
      entityId: id,
      before: { storageKey: asset.storageKey },
    });
  }
}
