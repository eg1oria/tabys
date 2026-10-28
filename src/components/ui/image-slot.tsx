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
        "flex items-end overflow-hidden bg-gradient-to-br from-[#dfe4e9] via-[#eef1f4] to-[#c9d1d8]",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,.75) 0 2px, transparent 2px 9px)",
        }}
      />
      <span className="relative z-10 p-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/45">
        {label ?? alt}
      </span>
    </div>
  );
}
