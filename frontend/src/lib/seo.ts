import type { Metadata } from "next";
import { company } from "./content/company";
import type { PublicImage } from "./api/types";
import ogImage from "@/assets/og-image.jpg";

/**
 * Картинка превью по умолчанию: 1200×630, ~80 КБ. Не файл-соглашение
 * app/opengraph-image: такая картинка подмешивается только на своём уровне,
 * и любая страница со своим openGraph теряла бы её (Next заменяет openGraph
 * целиком). Явное поле в baseOpenGraph переживает это.
 */
export const defaultOgImages = [
  {
    url: ogImage.src,
    width: ogImage.width,
    height: ogImage.height,
    alt: "Tabys Consulting — оборудование для пищевых производств, собственный цех в Алматы",
  },
];

/**
 * Общие поля превью ссылки. Next не дополняет openGraph страницы полями
 * из layout, а заменяет целиком (docs: generate-metadata, «Merging»), так
 * что каждая страница, задающая свой заголовок, повторяет их через spread.
 */
export const baseOpenGraph = {
  type: "website" as const,
  locale: "ru_RU",
  siteName: company.shortName,
  images: defaultOgImages,
};

/**
 * Метаданные обычной страницы сайта: без этого превью ссылки в WhatsApp
 * и Telegram показывало бы заголовок главной на любой странице.
 */
export function pageMetadata({
  title,
  description,
  path,
  ...rest
}: Omit<Metadata, "title" | "description" | "openGraph"> & {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      ...baseOpenGraph,
      title: `${title} — ${company.shortName}`,
      description,
      url: path,
    },
    ...rest,
  };
}

/** Ширина превью: столько просят Facebook и WhatsApp; есть в deviceSizes Next. */
const OG_WIDTH = 1200;

/**
 * og:image для фото из медиатеки — через оптимизатор Next, а не оригиналом.
 * Оригинал бывает снимком с телефона на несколько мегабайт или AVIF, и
 * тогда WhatsApp показывает ссылку без картинки. Оптимизатор отдаёт
 * уменьшенную копию в формате, который понимает краулер (по Accept).
 * Адрес относительный — абсолютным его делает metadataBase.
 */
export function mediaOgImage(image: PublicImage, alt: string) {
  const width = image.width ? Math.min(image.width, OG_WIDTH) : undefined;
  const height =
    width && image.width && image.height
      ? Math.round((image.height * width) / image.width)
      : undefined;
  return {
    url: `/_next/image?url=${encodeURIComponent(image.url)}&w=${OG_WIDTH}&q=75`,
    width,
    height,
    alt: image.alt || alt,
  };
}
