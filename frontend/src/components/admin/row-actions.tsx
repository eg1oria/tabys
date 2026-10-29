"use client";

import { useActionState, useState } from "react";
import { FieldError } from "@/components/ui/field";
import { SubmitButton } from "./submit-button";
import { FORM_ERROR, initialFormState, type FormState } from "@/lib/admin/form-state";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

/** Публикация и снятие с публикации — отдельные маршруты бэкенда. */
export function PublishToggle({
  id,
  published,
  action,
}: {
  id: string;
  published: boolean;
  action: Action;
}) {
  const [state, formAction] = useActionState(action, initialFormState);

  return (
    <form action={formAction} className="inline-flex flex-col gap-1">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="action" value={published ? "unpublish" : "publish"} />
      <SubmitButton
        variant="outline"
        className="h-8 px-3 text-[12px]"
        pendingLabel="Меняем…"
      >
        {published ? "Снять с сайта" : "Опубликовать"}
      </SubmitButton>
      <FieldError message={state.errors[FORM_ERROR]} />
    </form>
  );
}

/** Удаление в два шага: подтверждение прямо в кнопке, без модалки. */
export function DeleteButton({
  id,
  action,
  label = "Удалить",
}: {
  id: string;
  action: Action;
  label?: string;
}) {
  const [state, formAction] = useActionState(action, initialFormState);
  const [confirming, setConfirming] = useState(false);

  return (
    <form action={formAction} className="inline-flex flex-col gap-1">
      <input type="hidden" name="id" value={id} />
      {confirming ? (
        <span className="flex items-center gap-2">
          <SubmitButton variant="outline" className="h-8 px-3 text-[12px]" pendingLabel="Удаляем…">
            Точно удалить
          </SubmitButton>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-[12px] text-text-2 hover:text-ink"
          >
            Отмена
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="inline-flex h-8 items-center rounded-card border border-line px-3 text-[12px] font-medium text-text-2 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600"
        >
          {label}
        </button>
      )}
      <FieldError message={state.errors[FORM_ERROR]} />
    </form>
  );
}
