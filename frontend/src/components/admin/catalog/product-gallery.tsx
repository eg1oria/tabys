"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { IconButton } from "@/components/ui/icon-button";
import { ArrowLeft, ArrowRight, ImageIcon, Plus, Trash, Upload } from "@/components/ui/icons";
import { FormError } from "@/components/ui/field";
import type { PickableImage } from "@/components/admin/image-picker";
import { cn } from "@/lib/utils";

const MAX_BYTES = 10 * 1024 * 1024;

export type GalleryItem = { id: string; thumbUrl: string; alt: string };

/**
 * Галерея товара. Первая картинка — главная: её показывает сайт.
 *
 * Значения уходят скрытыми полями imageIds по порядку, плюс маркер
 * galleryShown: по нему Server Action понимает, что форма вообще
 * показывала галерею, и не трогает картинки, когда её не было.
 */
export function ProductGallery({
  initial,
  library,
}: {
  initial: GalleryItem[];
  library: PickableImage[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<GalleryItem[]>(initial);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  const picked = new Set(items.map((item) => item.id));

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    setItems((cur) => {
      const next = [...cur];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function toggle(image: PickableImage) {
    setItems((cur) =>
      cur.some((item) => item.id === image.id)
        ? cur.filter((item) => item.id !== image.id)
        : [...cur, { id: image.id, thumbUrl: image.thumbUrl, alt: image.alt }],
    );
  }

  async function upload(file: File) {
    if (file.size > MAX_BYTES) {
      setError("Файл больше 10 МБ");
      return;
    }
    setError(undefined);
    setPending(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/admin/media", { method: "POST", body });
      if (response.status === 401) {
        router.push("/admin/login?expired=1");
        return;
      }
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok || data === null || typeof data !== "object") {
        const message =
          data && typeof data === "object" && "message" in data
            ? String((data as { message: unknown }).message)
            : `Не удалось загрузить файл (${response.status})`;
        setError(message);
        return;
      }
      const asset = data as { id: string; url: string; alt?: string };
      setItems((cur) => [...cur, { id: asset.id, thumbUrl: asset.url, alt: asset.alt ?? "" }]);
      // Чтобы новая картинка появилась и в списке медиатеки ниже.
      router.refresh();
    } catch {
      setError("Сервер не отвечает");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="galleryShown" value="1" />
      {items.map((item) => (
        <input key={item.id} type="hidden" name="imageIds" value={item.id} />
      ))}

      <FormError message={error} />

      <div className="grid grid-cols-3 gap-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              "group relative aspect-square overflow-hidden rounded-card border",
              index === 0 ? "border-accent" : "border-line",
            )}
          >
            <Image
              src={item.thumbUrl}
              alt={item.alt}
              fill
              sizes="120px"
              className="object-cover"
              unoptimized
            />
            {index === 0 ? (
              <span className="absolute top-1 left-1 rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-semibold text-white">
                главная
              </span>
            ) : null}
            <span className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-ink/70 p-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <IconButton
                label="Левее"
                className="size-6 border-0 bg-transparent text-white hover:bg-white/20"
                onClick={() => move(index, -1)}
              >
                <ArrowLeft className="size-3.5" />
              </IconButton>
              <IconButton
                label="Правее"
                className="size-6 border-0 bg-transparent text-white hover:bg-white/20"
                onClick={() => move(index, 1)}
              >
                <ArrowRight className="size-3.5" />
              </IconButton>
              <IconButton
                label="Убрать"
                className="size-6 border-0 bg-transparent text-white hover:bg-white/20"
                onClick={() => setItems((cur) => cur.filter((i) => i.id !== item.id))}
              >
                <Trash className="size-3.5" />
              </IconButton>
            </span>
          </div>
        ))}

        <label
          className={cn(
            "flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-card border border-dashed border-line text-[11px] text-text-2 transition-colors hover:border-accent hover:text-accent",
            "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent",
          )}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            disabled={pending}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void upload(file);
            }}
          />
          {pending ? (
            <span>Загружаем…</span>
          ) : (
            <>
              <Plus className="size-5" />
              Добавить фото
            </>
          )}
        </label>
      </div>

      <details className="rounded-card border border-line">
        <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-[12.5px] text-text-2">
          <Upload className="size-4" />
          Выбрать из медиатеки
        </summary>
        <div className="max-h-[220px] overflow-y-auto border-t border-line p-2">
          {library.length === 0 ? (
            <p className="px-1 py-2 text-[12.5px] text-text-2">Медиатека пуста</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {library.map((image) => (
                <button
                  key={image.id}
                  type="button"
                  title={image.originalName}
                  onClick={() => toggle(image)}
                  className={cn(
                    "relative aspect-square overflow-hidden rounded-card border",
                    picked.has(image.id) ? "border-accent ring-2 ring-accent/30" : "border-line",
                  )}
                >
                  <Image
                    src={image.thumbUrl}
                    alt={image.alt || image.originalName}
                    fill
                    sizes="80px"
                    className="object-cover"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </details>

      {items.length === 0 ? (
        <p className="flex items-center gap-2 text-[12px] text-text-2">
          <ImageIcon className="size-4" />
          Без фото товар выглядит пустым на сайте.
        </p>
      ) : null}
    </div>
  );
}
