import { randomUUID } from 'node:crypto';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import type { PrismaClient } from '../src/prisma/client.js';
import { categorySeeds } from './seed-data/categories.js';

/** Путь из данных фронтенда -> id MediaAsset. */
export type MediaIndex = Map<string, string>;

/** Фото вёрстки фронтенда: пути в данных вида /images/<файл>.jpg. */
const FRONTEND_ASSETS = resolve(process.cwd(), '../frontend/src/assets');
const UPLOAD_DIR = resolve(process.cwd(), (process.env.UPLOAD_DIR ?? './uploads').replace(/^\.\//, ''));

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Переносит фото категорий из frontend/src/assets/images в медиатеку.
 * У категорий без фото (насосы, уплотнения, «другое») imageId остаётся
 * пустым — сайт рисует плейсхолдер, пока обложку не загрузят в админке.
 */
export async function seedMedia(prisma: PrismaClient): Promise<MediaIndex> {
  const index: MediaIndex = new Map();
  const unique = [
    ...new Set(categorySeeds.flatMap((c) => (c.image ? [c.image] : []))),
  ];
  let imported = 0;
  let missing = 0;

  for (const publicPath of unique) {
    const source = join(FRONTEND_ASSETS, publicPath.replace(/^\//, ''));

    if (!(await exists(source))) {
      missing += 1;
      continue;
    }

    const originalName = publicPath.split('/').pop() ?? 'image.jpg';

    // Повторный прогон не должен плодить копии одного файла.
    const already = await prisma.mediaAsset.findFirst({
      where: { originalName },
      select: { id: true },
    });
    if (already) {
      index.set(publicPath, already.id);
      continue;
    }

    const buffer = await readFile(source);
    const sniffed = await fileTypeFromBuffer(buffer);
    if (!sniffed) {
      missing += 1;
      continue;
    }

    const key = `seed/${randomUUID()}.${sniffed.ext}`;
    const target = join(UPLOAD_DIR, key);
    await mkdir(join(UPLOAD_DIR, 'seed'), { recursive: true });
    await writeFile(target, buffer);

    const meta = await sharp(buffer).metadata();
    const blur = await sharp(buffer).resize({ width: 16 }).webp({ quality: 40 }).toBuffer();

    const asset = await prisma.mediaAsset.create({
      data: {
        storageKey: key,
        originalName,
        mimeType: sniffed.mime,
        bytes: buffer.byteLength,
        width: meta.width ?? null,
        height: meta.height ?? null,
        blurDataUrl: `data:image/webp;base64,${blur.toString('base64')}`,
        alt: '',
      },
      select: { id: true },
    });

    index.set(publicPath, asset.id);
    imported += 1;
  }

  // Один файл может обслуживать несколько категорий (cat-tanks — и ёмкости,
  // и ЦКТ), поэтому связываем по карте, а не копируем файл на каждую.
  let linked = 0;
  for (const seed of categorySeeds) {
    const imageId = seed.image ? index.get(seed.image) : undefined;
    if (!imageId) continue;
    const { count } = await prisma.category.updateMany({
      where: { slug: seed.slug, imageId: null },
      data: { imageId },
    });
    linked += count;
  }

  console.log(
    `  медиа: импортировано ${imported}, уже было ${index.size - imported}, ` +
      `нет файла ${missing}, привязано к категориям ${linked}`,
  );
  return index;
}
