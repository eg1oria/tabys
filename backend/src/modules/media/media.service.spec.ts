import { BadRequestException } from '@nestjs/common';
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import { MediaService } from './media.service.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import type { AppConfigService } from '../../config/app-config.service.js';
import type { AuditService } from '../../common/audit/audit.service.js';
import type { AuthUser } from '../../auth/types.js';

const actor: AuthUser = { id: 'u1', email: 'o@tabys.kz', role: 'OWNER' };

function stub(asset: Record<string, unknown> | null = null) {
  return {
    mediaAsset: {
      create: vi.fn(async ({ data }: { data: object }) => ({
        id: 'm1',
        ...data,
      })),
      findUnique: vi.fn().mockResolvedValue(asset),
      delete: vi.fn().mockResolvedValue({}),
    },
  };
}

async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries.filter((e) => e.isFile()).map((e) => e.name);
}

function image(width: number, height: number, format: 'png' | 'jpeg' = 'png') {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 200, g: 50, b: 50 },
    },
  })[format]();
}

describe('MediaService', () => {
  let uploads: string;
  let prisma: ReturnType<typeof stub>;
  let svc: MediaService;

  function make(asset: Record<string, unknown> | null = null) {
    prisma = stub(asset);
    svc = new MediaService(
      prisma as unknown as PrismaService,
      { uploadDir: uploads, publicUrl: 'https://tabys.kz' } as AppConfigService,
      { log: vi.fn() } as unknown as AuditService,
    );
  }

  beforeEach(async () => {
    uploads = await mkdtemp(join(tmpdir(), 'tabys-media-'));
    make();
  });
  afterEach(async () => {
    await rm(uploads, { recursive: true, force: true });
  });

  describe('загрузка', () => {
    it('не картинку не принимает, на диск ничего не пишет', async () => {
      const file = {
        originalname: 'photo.jpg',
        buffer: Buffer.from('%PDF-1.4 fake'),
        size: 13,
      };
      await expect(svc.upload(file, '', actor)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(await readdir(uploads)).toEqual([]);
      expect(prisma.mediaAsset.create).not.toHaveBeenCalled();
    });

    it('уменьшенные копии — только те, что не больше оригинала', async () => {
      const buffer = await image(900, 600).toBuffer();
      const created = await svc.upload(
        { originalname: 'cat.png', buffer, size: buffer.length },
        'Ёмкость',
        actor,
      );

      const derivatives = created.derivatives as Record<string, string>;
      expect(Object.keys(derivatives).sort()).toEqual(['400', '800']);
      expect(created).toMatchObject({
        width: 900,
        height: 600,
        mimeType: 'image/png',
        alt: 'Ёмкость',
      });
      expect(created.url).toBe(
        `https://tabys.kz/uploads/${created.storageKey}`,
      );
      expect(created.blurDataUrl).toMatch(/^data:image\/webp;base64,/);
      // Оригинал и две копии.
      expect(await listFiles(uploads)).toHaveLength(3);
    });

    it('у фото, повёрнутого через EXIF, размеры — как на экране', async () => {
      // Телефон снимает «лёжа» и пишет поворот в EXIF: пиксели 800×600,
      // а на экране кадр вертикальный, 600×800.
      const buffer = await image(800, 600, 'jpeg')
        .withMetadata({ orientation: 6 })
        .toBuffer();
      const created = await svc.upload(
        { originalname: 'ceh.jpg', buffer, size: buffer.length },
        '',
        actor,
      );

      expect(created).toMatchObject({ width: 600, height: 800 });
      const original = await sharp(
        join(uploads, created.storageKey),
      ).metadata();
      expect([original.width, original.height]).toEqual([600, 800]);
      // EXIF снят целиком — вместе с поворотом и GPS.
      expect(original.orientation).toBeUndefined();
      expect(Object.keys(created.derivatives as object)).toEqual(['400']);
    });
  });

  describe('удаление', () => {
    const used = { categories: 0, products: 0, productImages: 0 };

    it('используемую картинку не удаляет и говорит где она стоит', async () => {
      make({
        id: 'm1',
        storageKey: 'a.jpg',
        _count: { ...used, products: 2, productImages: 1 },
      });
      await expect(svc.remove('m1', actor)).rejects.toThrow(
        /обложки товаров: 2, галереи товаров: 1/,
      );
      expect(prisma.mediaAsset.delete).not.toHaveBeenCalled();
    });

    it('гонка с галереей (P2003) — тоже 400, а не 500', async () => {
      make({ id: 'm1', storageKey: 'a.jpg', _count: used });
      prisma.mediaAsset.delete.mockRejectedValue(
        Object.assign(new Error('fk'), { code: 'P2003' }),
      );
      await expect(svc.remove('m1', actor)).rejects.toThrow(/галерея товара/);
    });

    it('удаляет оригинал и копии; отсутствующий файл удаление не валит', async () => {
      make({
        id: 'm1',
        storageKey: '2026/10/a.jpg',
        derivatives: {
          '400': '2026/10/a-400.webp',
          '800': '2026/10/a-800.webp',
        },
        _count: used,
      });
      for (const key of ['2026/10/a.jpg', '2026/10/a-400.webp']) {
        await mkdir(dirname(join(uploads, key)), { recursive: true });
        await writeFile(join(uploads, key), 'x');
      }

      await svc.remove('m1', actor);

      expect(prisma.mediaAsset.delete).toHaveBeenCalledWith({
        where: { id: 'm1' },
      });
      expect(await listFiles(uploads)).toEqual([]);
    });
  });
});
