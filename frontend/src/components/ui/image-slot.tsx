import Image from "next/image";
import { hasImage } from "@/lib/images";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  alt: string;
  /** Подпись в плейсхолдере, если фото ещё нет. */
  label?: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
};

/**
 * Слот под фотографию. Пока файла нет — рисует «стальной» плейсхолдер
 * вместо битой картинки, поэтому вёрстку можно делать до съёмки.
 */
export function ImageSlot({
  src,
  alt,
  label,
  className,
  imageClassName,
  sizes = "100vw",
  priority,
}: Props) {
  // Если вызывающий код сам позиционирует слот (absolute/fixed), не навязываем relative:
  // две утилиты position в одном классе конфликтуют и побеждает та, что идёт позже в CSS.
  const position = /\b(absolute|fixed|sticky)\b/.test(className ?? "") ? "" : "relative";

  if (hasImage(src)) {
    return (
      <div className={cn(position, "overflow-hidden bg-muted", className)}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn("object-cover", imageClassName)}
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        position,
        "flex flex-col items-center justify-center gap-3 overflow-hidden bg-gradient-to-br from-[#c3ccd4] via-[#dde3e9] to-[#a9b4bf] p-4 text-center",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,.8) 0 3px, transparent 3px 11px)",
        }}
      />
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        className="relative z-10 size-7 text-ink/35"
      >
        <rect x="3" y="5" width="18" height="14" rx="1.5" />
        <circle cx="8.5" cy="10" r="1.5" />
        <path d="m4 17 5-5 4 4 2.5-2.5L20 17" />
      </svg>
      <span className="relative z-10 text-[11px] font-semibold uppercase leading-snug tracking-[0.14em] text-ink/45">
        {label ?? alt}
      </span>
    </div>
  );
}
