import { writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { datePrefix, ensureDir, resolveWithin, safeFilename } from './storage.js';

/** Что действительно принимаем как изображение — по магическим байтам. */
const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);

/**
 * Ширины уменьшенных копий. Сейчас нужна только 400 — миниатюры в админке;
 * сайт отдаёт оригинал через next/image. Лишняя ширина — это лишний
 * прогон sharp на каждую загрузку и лишний файл на диске.
 */
const DERIVATIVE_WIDTHS = [400] as const;

export type SniffedImage = { mime: string; ext: string };

/** Расширению не верим: настоящий тип — по содержимому. null — не картинка. */
export async function sniffImage(
  buffer: Buffer,
): Promise<{ image: SniffedImage | null; detected?: string }> {
  const sniffed = await fileTypeFromBuffer(buffer);
  if (!sniffed || !ALLOWED_IMAGE_MIME.has(sniffed.mime)) {
    return { image: null, detected: sniffed?.mime };
  }
  return { image: { mime: sniffed.mime, ext: sniffed.ext } };
}

/** Поля MediaAsset, которые получаются из самого файла. */
export type StoredImage = {
  storageKey: string;
  mimeType: string;
  bytes: number;
  width: number;
  height: number;
  blurDataUrl: string;
  derivatives: Record<string, string>;
};

/**
 * Кладёт картинку в каталог загрузок так, как её потом отдаёт сайт:
 * развёрнутой по EXIF, без метаданных, с уменьшенными копиями и blur.
 * Одна дорога и для загрузки из админки, и для сида — иначе картинки
 * из сида отличались бы от загруженных руками.
 */
export async function storeImage(
  buffer: Buffer,
  sniffed: SniffedImage,
  uploadDir: string,
): Promise<StoredImage> {
  const prefix = datePrefix();
  const filename = safeFilename(`x.${sniffed.ext}`);
  const storageKey = `${prefix}/${filename}`;
  const absolute = resolveWithin(uploadDir, storageKey);
  await ensureDir(dirname(absolute));

  const image = sharp(buffer, { failOn: 'error' });
  // autoOrient — размеры с учётом поворота из EXIF: телефон пишет кадр
  // «лёжа» и разворачивает его флагом. Файл ниже поворачиваем так же,
  // иначе вертикальное фото получило бы горизонтальные width/height.
  const { autoOrient: meta } = await image.metadata();

  // Метаданные не переносим: это снимает GPS-теги с фотографий из цеха.
  // Перекодированный файл весит не столько, сколько прислали, поэтому
  // bytes считаем по тому, что реально легло на диск, вместе с копиями.
  const original = await image.rotate().toBuffer();
  await writeFile(absolute, original);

  const { derivatives, bytes } = await writeDerivatives(
    buffer,
    storageKey,
    meta.width,
    uploadDir,
  );

  const blur = await sharp(buffer)
    .rotate()
    .resize({ width: 16 })
    .webp({ quality: 40 })
    .toBuffer();

  return {
    storageKey,
    mimeType: sniffed.mime,
    bytes: original.byteLength + bytes,
    width: meta.width,
    height: meta.height,
    blurDataUrl: `data:image/webp;base64,${blur.toString('base64')}`,
    derivatives,
  };
}

/**
 * Уменьшенные копии рядом с оригиналом: `<ключ без расширения>-<ширина>.webp`.
 * Копию шире самой картинки не делаем — растянутая она только тяжелее.
 * Отдельно от storeImage, чтобы сид мог доделать копии старым записям.
 */
export async function writeDerivatives(
  buffer: Buffer,
  storageKey: string,
  width: number,
  uploadDir: string,
): Promise<{ derivatives: Record<string, string>; bytes: number }> {
  const derivatives: Record<string, string> = {};
  let bytes = 0;

  for (const target of DERIVATIVE_WIDTHS) {
    if (width < target) continue;
    const key = `${storageKey.replace(/\.[^./]+$/, '')}-${target}.webp`;
    const derivative = await sharp(buffer)
      .rotate()
      .resize({ width: target, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    await writeFile(resolveWithin(uploadDir, key), derivative);
    bytes += derivative.byteLength;
    derivatives[String(target)] = key;
  }

  return { derivatives, bytes };
}
