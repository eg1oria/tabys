import Image from "next/image";
import { ImageIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export type PickableImage = {
  id: string;
  thumbUrl: string;
  alt: string;
  originalName: string;
};

/**
 * Выбор картинки радиокнопками внутри <details> — без JS и без клиентского
 * компонента: раскрытие умеет сам браузер, а выбранное значение уходит
 * обычным полем формы.
 */
export function ImagePicker({
  images,
  value,
  current,
}: {
  images: PickableImage[];
  value: string | null;
  current: { thumbUrl: string; alt: string } | null;
}) {
  return (
    <details className="rounded-card border border-line bg-white">
      <summary className="flex cursor-pointer items-center gap-3 px-3.5 py-2.5 text-[13px]">
        {current ? (
          <span className="relative size-10 shrink-0 overflow-hidden rounded-card bg-muted">
            <Image
              src={current.thumbUrl}
              alt=""
              fill
              sizes="40px"
              className="object-cover"
              unoptimized
            />
          </span>
        ) : (
          <span className="grid size-10 shrink-0 place-items-center rounded-card bg-muted text-text-2">
            <ImageIcon className="size-5" />
          </span>
        )}
        <span className="min-w-0 flex-1 truncate">
          {current ? current.alt || "Картинка выбрана" : "Без картинки"}
        </span>
        <span className="shrink-0 text-[12px] text-accent">Выбрать</span>
      </summary>

      <div className="max-h-[320px] overflow-y-auto border-t border-line p-3">
        {images.length === 0 ? (
          <p className="px-1 py-3 text-[12.5px] text-text-2">
            Медиатека пуста — загрузите картинку в разделе «Медиа».
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            <label
              className={cn(
                "flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-card border border-line text-[11.5px] text-text-2",
                "has-checked:border-accent has-checked:text-accent",
              )}
            >
              <input
                type="radio"
                name="imageId"
                value=""
                defaultChecked={!value}
                className="sr-only"
              />
              <ImageIcon className="size-5" />
              Без картинки
            </label>

            {images.map((image) => (
              <label
                key={image.id}
                title={image.originalName}
                className={cn(
                  "relative aspect-square cursor-pointer overflow-hidden rounded-card border border-line",
                  "has-checked:border-accent has-checked:ring-2 has-checked:ring-accent/30",
                )}
              >
                <input
                  type="radio"
                  name="imageId"
                  value={image.id}
                  defaultChecked={value === image.id}
                  className="sr-only"
                />
                <Image
                  src={image.thumbUrl}
                  alt={image.alt || image.originalName}
                  fill
                  sizes="120px"
                  className="object-cover"
                  unoptimized
                />
              </label>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
