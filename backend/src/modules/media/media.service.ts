import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AppConfigService } from '../../config/app-config.service.js';
import { AuditService } from '../../common/audit/audit.service.js';
import { paginate, type Paginated, type PaginationDto } from '../../common/dto/pagination.dto.js';
import { datePrefix, ensureDir, resolveWithin, safeFilename } from './storage.js';
import type { AuthUser } from '../../auth/types.js';
import { decodeMultipartFilename } from '../../common/http/multipart-filename.js';

/** Что действительно принимаем как изображение — по магическим байтам. */
const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);

const DERIVATIVE_WIDTHS = [400, 800, 1600] as const;

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
    // Расширению не верим: проверяем настоящий тип по содержимому.
    const sniffed = await fileTypeFromBuffer(file.buffer);
    if (!sniffed || !ALLOWED_IMAGE_MIME.has(sniffed.mime)) {
      throw new BadRequestException(
        `Это не изображение (определён тип: ${sniffed?.mime ?? 'неизвестно'})`,
      );
    }

    const prefix = datePrefix();
    const filename = safeFilename(`x.${sniffed.ext}`);
    const storageKey = `${prefix}/${filename}`;
    const absolute = resolveWithin(this.config.uploadDir, storageKey);
    await ensureDir(dirname(absolute));

    const image = sharp(file.buffer, { failOn: 'error' });
    const meta = await image.metadata();

    // Метаданные не переносим: это снимает GPS-теги с фотографий из цеха.
    await writeFile(absolute, await image.rotate().toBuffer());

    const derivatives: Record<string, string> = {};
    for (const width of DERIVATIVE_WIDTHS) {
      if (meta.width && meta.width < width) continue;
      const derivativeKey = `${prefix}/${filename.replace(/\.[^.]+$/, '')}-${width}.webp`;
      const derivativeAbs = resolveWithin(this.config.uploadDir, derivativeKey);
      await writeFile(
        derivativeAbs,
        await sharp(file.buffer)
          .rotate()
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer(),
      );
      derivatives[String(width)] = derivativeKey;
    }

    const blur = await sharp(file.buffer)
      .rotate()
      .resize({ width: 16 })
      .webp({ quality: 40 })
      .toBuffer();

    const created = await this.prisma.mediaAsset.create({
      data: {
        storageKey,
        originalName: decodeMultipartFilename(file.originalname).slice(0, 255),
        mimeType: sniffed.mime,
        bytes: file.size,
        width: meta.width ?? null,
        height: meta.height ?? null,
        blurDataUrl: `data:image/webp;base64,${blur.toString('base64')}`,
        derivatives,
        alt,
        uploadedById: actor.id,
      },
    });

    await this.audit.log({
      actor,
      action: 'media.upload',
      entity: 'MediaAsset',
      entityId: created.id,
      after: { storageKey, bytes: file.size, mimeType: sniffed.mime },
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
      include: { _count: { select: { categories: true, products: true } } },
    });
    if (!asset) throw new NotFoundException('Файл не найден');

    const used = asset._count.categories + asset._count.products;
    if (used > 0) {
      throw new BadRequestException(
        `Изображение используется в ${used} записях — сначала отвяжите его`,
      );
    }

    await this.prisma.mediaAsset.delete({ where: { id } });

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

  /** Используется сидом: заводит запись из файла, уже лежащего на диске. */
  async importFromFile(
    sourcePath: string,
    alt: string,
  ): Promise<{ id: string; storageKey: string }> {
    const buffer = await readFile(sourcePath);
    const sniffed = await fileTypeFromBuffer(buffer);
    if (!sniffed || !ALLOWED_IMAGE_MIME.has(sniffed.mime)) {
      throw new BadRequestException(`${sourcePath}: не изображение`);
    }

    const prefix = datePrefix();
    const filename = safeFilename(`x.${sniffed.ext}`);
    const storageKey = `${prefix}/${filename}`;
    const absolute = resolveWithin(this.config.uploadDir, storageKey);
    await ensureDir(dirname(absolute));
    await writeFile(absolute, buffer);

    const meta = await sharp(buffer).metadata();
    const blur = await sharp(buffer).resize({ width: 16 }).webp({ quality: 40 }).toBuffer();

    const created = await this.prisma.mediaAsset.create({
      data: {
        storageKey,
        originalName: sourcePath.split('/').pop() ?? 'image',
        mimeType: sniffed.mime,
        bytes: buffer.byteLength,
        width: meta.width ?? null,
        height: meta.height ?? null,
        blurDataUrl: `data:image/webp;base64,${blur.toString('base64')}`,
        alt,
      },
      select: { id: true, storageKey: true },
    });

    return created;
  }

}
