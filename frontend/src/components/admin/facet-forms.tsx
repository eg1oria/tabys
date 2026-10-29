"use client";

import { useActionState, useState } from "react";
import { FieldError, FormError, TextInput } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { Plus, Trash } from "@/components/ui/icons";
import { SubmitButton } from "./submit-button";
import {
  createFacetValue,
  deleteFacetValue,
  updateFacetValue,
} from "@/lib/admin/facet-actions";
import { FORM_ERROR, initialFormState } from "@/lib/admin/form-state";
import type { AdminFacetValue } from "@/lib/api/types";

export function FacetValueRow({ value }: { value: AdminFacetValue }) {
  const [saveState, save] = useActionState(updateFacetValue, initialFormState);
  const [removeState, remove] = useActionState(deleteFacetValue, initialFormState);
  const [confirming, setConfirming] = useState(false);
  const used = value._count.categories + value._count.products;

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-start gap-2">
        {/* value неизменяем: он уже стоит в адресах фильтров каталога. */}
        <code className="mt-2 w-28 shrink-0 truncate text-[12px] text-text-2" title={value.value}>
          {value.value}
        </code>

        <form action={save} className="flex flex-1 flex-wrap items-start gap-2">
          <input type="hidden" name="id" value={value.id} />
          {/* Ширину задаёт обёртка: у самого поля в fieldBase стоит w-full. */}
          <span className="min-w-[160px] flex-1">
            <TextInput
              name="label"
              defaultValue={value.label}
              aria-label={`Подпись значения ${value.value}`}
              error={saveState.errors.label}
              maxLength={200}
            />
          </span>
          <span className="w-20 shrink-0">
            <TextInput
              name="sortOrder"
              type="number"
              min={0}
              defaultValue={value.sortOrder}
              aria-label={`Порядок значения ${value.value}`}
            />
          </span>
          <SubmitButton variant="outline" className="h-10 px-3 text-[12px]">
            Сохранить
          </SubmitButton>
          {saveState.status === "success" ? (
            <span className="mt-3 text-[12px] text-emerald-600">Готово</span>
          ) : null}
        </form>

        <form action={remove} className="flex items-start gap-2">
          <input type="hidden" name="id" value={value.id} />
          {confirming ? (
            <>
              <SubmitButton variant="outline" className="h-10 px-3 text-[12px]" pendingLabel="Удаляем…">
                Точно удалить
              </SubmitButton>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="mt-3 text-[12px] text-text-2 hover:text-ink"
              >
                Отмена
              </button>
            </>
          ) : (
            <IconButton
              label={`Удалить значение ${value.label}`}
              tone="danger"
              className="mt-1"
              onClick={() => setConfirming(true)}
            >
              <Trash className="size-4" />
            </IconButton>
          )}
        </form>
      </div>

      <p className="mt-1 text-[11.5px] text-text-2">
        {used === 0 ? "Нигде не используется" : `Используется: ${used}`}
      </p>
      <FieldError message={saveState.errors[FORM_ERROR] ?? removeState.errors[FORM_ERROR]} />
    </li>
  );
}

export function FacetValueCreate({ groupKey }: { groupKey: string }) {
  const [state, formAction] = useActionState(createFacetValue, initialFormState);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="border-t border-line px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-accent hover:underline"
        >
          <Plus className="size-4" />
          Добавить значение
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-2 border-t border-line px-4 py-3">
      <input type="hidden" name="groupKey" value={groupKey} />
      <FormError message={state.errors[FORM_ERROR]} />

      <div className="flex flex-wrap items-start gap-2">
        <span className="min-w-[160px] flex-1">
          <TextInput
            name="value"
            placeholder="aisi321"
            aria-label="Значение (латиницей, попадёт в адрес фильтра)"
            error={state.errors.value}
          />
          <FieldError message={state.errors.value} />
        </span>
        <span className="min-w-[200px] flex-1">
          <TextInput
            name="label"
            placeholder="Нержавеющая сталь AISI 321"
            aria-label="Подпись"
            error={state.errors.label}
          />
          <FieldError message={state.errors.label} />
        </span>
        <span className="w-20 shrink-0">
          <TextInput name="sortOrder" type="number" min={0} defaultValue={0} aria-label="Порядок" />
        </span>
        <SubmitButton className="h-10 px-4 text-[12px]" pendingLabel="Добавляем…">
          Добавить
        </SubmitButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-3 text-[12px] text-text-2 hover:text-ink"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
