"use client";

import { useActionState } from "react";
import { Field, FormError, TextInput } from "@/components/ui/field";
import { SubmitButton } from "./submit-button";
import { changePassword } from "@/lib/admin/auth-actions";
import { FORM_ERROR, initialFormState } from "@/lib/admin/form-state";

export function PasswordForm() {
  const [state, formAction] = useActionState(changePassword, initialFormState);
  const errors = state.errors;

  if (state.status === "success") {
    return (
      <p role="status" className="rounded-card border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-[12.5px] leading-relaxed text-emerald-700">
        Пароль изменён. Остальные сессии завершены — на других устройствах
        придётся войти заново.
      </p>
    );
  }

  return (
    <form action={formAction} noValidate className="max-w-sm space-y-4">
      <FormError message={errors[FORM_ERROR]} />

      <Field label="Текущий пароль" htmlFor="currentPassword" error={errors.currentPassword} required>
        <TextInput
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          error={errors.currentPassword}
        />
      </Field>

      <Field
        label="Новый пароль"
        htmlFor="newPassword"
        error={errors.newPassword}
        hint="Не короче 12 символов, не из одних цифр, без email и слов вроде password. Проще всего — фраза из нескольких слов."
        required
      >
        <TextInput
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          error={errors.newPassword}
        />
      </Field>

      <Field label="Повторите пароль" htmlFor="repeatPassword" error={errors.repeatPassword} required>
        <TextInput
          id="repeatPassword"
          name="repeatPassword"
          type="password"
          autoComplete="new-password"
          error={errors.repeatPassword}
        />
      </Field>

      <SubmitButton pendingLabel="Меняем…">Сменить пароль</SubmitButton>
    </form>
  );
}
