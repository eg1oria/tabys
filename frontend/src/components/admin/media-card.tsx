"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { FieldError, TextInput } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { Trash } from "@/components/ui/icons";
import { SubmitButton } from "./submit-button";
import { deleteMedia, updateMediaAlt } from "@/lib/admin/media-actions";
import { FORM_ERROR, initialFormState } from "@/lib/admin/form-state";
import { formatBytes } from "@/lib/admin/format";
import type { MediaAsset } from "@/lib/api/types";

export function MediaCard({ asset, thumbUrl }: { asset: MediaAsset; thumbUrl: string }) {
  const [altState, saveAlt] = useActionState(updateMediaAlt, initialFormState);
  const [removeState, remove] = useActionState(deleteMedia, initialFormState);
  const [confirming, setConfirming] = useState(false);

  return (
    <li className="flex flex-col overflow-hidden rounded-card border border-line bg-white">
      <div className="relative aspect-4/3 bg-muted">
        {/* unoptimized — потому что это уже готовая webp-производная на 400px,
            которую сделал бэкенд при загрузке. Гонять её через оптимизатор
            Next значило бы пережимать пережатое. */}
        <Image
          src={thumbUrl}
          alt={asset.alt || asset.originalName}
          fill
          sizes="(min-width: 1024px) 240px, 45vw"
          className="object-cover"
          placeholder={asset.blurDataUrl ? "blur" : "empty"}
          blurDataURL={asset.blurDataUrl ?? undefined}
          unoptimized
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-3.5">
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-medium" title={asset.originalName}>
            {asset.originalName}
          </p>
          <p className="mt-0.5 text-[11.5px] text-text-2">
            {formatBytes(asset.bytes)}
            {asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : null}
          </p>
        </div>

        <form action={saveAlt} className="space-y-2">
          <input type="hidden" name="id" value={asset.id} />
          <TextInput
            name="alt"
            defaultValue={asset.alt}
            placeholder="Подпись (alt)"
            maxLength={300}
            aria-label={`Подпись для ${asset.originalName}`}
            error={altState.errors.alt}
          />
          <FieldError message={altState.errors.alt ?? altState.errors[FORM_ERROR]} />
          <div className="flex items-center justify-between gap-2">
            <SubmitButton variant="outline" className="h-8 px-3 text-[12px]">
              Сохранить
            </SubmitButton>
            {altState.status === "success" ? (
              <span className="text-[11.5px] text-emerald-600">Сохранено</span>
            ) : null}
          </div>
        </form>

        <form action={remove} className="mt-auto border-t border-line pt-3">
          <input type="hidden" name="id" value={asset.id} />
          <FieldError message={removeState.errors[FORM_ERROR]} />
          {confirming ? (
            <div className="flex items-center gap-2">
              <SubmitButton variant="outline" pendingLabel="Удаляем…" className="h-8 px-3 text-[12px]">
                Точно удалить
              </SubmitButton>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="text-[12px] text-text-2 hover:text-ink"
              >
                Отмена
              </button>
            </div>
          ) : (
            <IconButton
              label={`Удалить ${asset.originalName}`}
              tone="danger"
              onClick={() => setConfirming(true)}
            >
              <Trash className="size-4" />
            </IconButton>
          )}
        </form>
      </div>
    </li>
  );
}
