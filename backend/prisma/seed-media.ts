import { access, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { PrismaClient } from '../src/prisma/client.js';
import {
  sniffImage,
  storeImage,
  writeDerivatives,
} from '../src/modules/media/image-pipeline.js';
import { resolveWithin } from '../src/modules/media/storage.js';
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
  let backfilled = 0;

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
      select: { id: true, storageKey: true, bytes: true, width: true, derivatives: true },
    });
    if (already) {
      if (await backfillDerivatives(prisma, already)) backfilled += 1;
      index.set(publicPath, already.id);
      continue;
    }

    const buffer = await readFile(source);
    const { image } = await sniffImage(buffer);
    if (!image) {
      missing += 1;
      continue;
    }

    // Та же обработка, что у загрузки из админки: копия на 400 для
    // миниатюр, поворот по EXIF, без метаданных.
    const asset = await prisma.mediaAsset.create({
      data: { ...(await storeImage(buffer, image, UPLOAD_DIR)), originalName, alt: '' },
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
    `  медиа: импортировано ${imported}, уже было ${index.size - imported}` +
      ` (доделаны копии: ${backfilled}), нет файла ${missing}, привязано к категориям ${linked}`,
  );
  return index;
}

/**
 * Старый сид клал картинки без уменьшенных копий, и миниатюры в админке
 * тянули оригинал. Доделываем копии записям, у которых их нет.
 */
async function backfillDerivatives(
  prisma: PrismaClient,
  asset: {
    id: string;
    storageKey: string;
    bytes: number;
    width: number | null;
    derivatives: unknown;
  },
): Promise<boolean> {
  const has = Object.keys((asset.derivatives ?? {}) as Record<string, string>).length > 0;
  if (has || !asset.width) return false;

  const path = resolveWithin(UPLOAD_DIR, asset.storageKey);
  if (!(await exists(path))) return false;

  const { derivatives, bytes } = await writeDerivatives(
    await readFile(path),
    asset.storageKey,
    asset.width,
    UPLOAD_DIR,
  );
  if (bytes === 0) return false;

  await prisma.mediaAsset.update({
    where: { id: asset.id },
    data: { derivatives, bytes: asset.bytes + bytes },
  });
  return true;
}
