"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Upload } from "@/components/ui/icons";
import { FormError, TextInput } from "@/components/ui/field";
import { cn } from "@/lib/utils";

const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Загрузка идёт обычным fetch в /api/admin/media, а не Server Action:
 * тело Server Action ограничено 4 МБ, а картинку бэкенд принимает до 10 МБ.
 */
export function MediaUpload() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");

    if (!(file instanceof File) || file.size === 0) {
      setError("Выберите файл");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Файл больше 10 МБ");
      return;
    }

    setError(undefined);
    setPending(true);
    try {
      const response = await fetch("/api/admin/media", { method: "POST", body: data });
      if (response.status === 401) {
        // Сессия кончилась, пока выбирали файл: без этой ветки редирект
        // маршрута проходил бы молча и загрузка «успешно» ничего не делала.
        router.push("/admin/login?expired=1");
        return;
      }
      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const message =
          body !== null && typeof body === "object" && "message" in body
            ? String((body as { message: unknown }).message)
            : `Не удалось загрузить файл (${response.status})`;
        setError(message);
        return;
      }
      form.reset();
      setFileName(null);
      // Сетка — серверный компонент, перечитать её может только роутер.
      router.refresh();
    } catch {
      setError("Сервер не отвечает");
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3 px-5 py-4">
      <FormError message={error} />

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
        <div>
          <label
            htmlFor="media-file"
            className={cn(
              "flex h-10 cursor-pointer items-center gap-2.5 rounded-card border border-dashed border-line bg-white px-3.5 transition-colors hover:border-accent",
              // Поле скрыто визуально — рамку фокуса рисуем на подписи.
              "peer-focus-visible:border-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent",
            )}
          >
            <Upload className="size-4 shrink-0 text-text-2" />
            <span className="min-w-0 truncate text-[13px]">
              {fileName ?? "Выбрать изображение"}
            </span>
          </label>
          <input
            id="media-file"
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="peer sr-only"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
          <p className="mt-1.5 text-[12px] text-text-2">JPEG, PNG, WebP, AVIF — до 10 МБ</p>
        </div>

        <TextInput name="alt" placeholder="Подпись (alt) — что на фото" maxLength={300} />

        <button
          type="submit"
          disabled={pending}
          className={cn(
            "inline-flex h-10 items-center justify-center rounded-card bg-accent px-5 text-[13px] font-medium text-white transition-colors hover:bg-accent-strong",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {pending ? "Загружаем…" : "Загрузить"}
        </button>
      </div>
    </form>
  );
}
