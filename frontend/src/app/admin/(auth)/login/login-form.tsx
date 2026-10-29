"use client";

import { useActionState } from "react";
import { Field, FormError, TextInput } from "@/components/ui/field";
import { SubmitButton } from "@/components/admin/submit-button";
import { login } from "@/lib/admin/auth-actions";
import { FORM_ERROR, initialFormState } from "@/lib/admin/form-state";

export function LoginForm({ next, expired }: { next: string; expired: boolean }) {
  const [state, formAction] = useActionState(login, initialFormState);
  const errors = state.errors;

  return (
    <form action={formAction} noValidate className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next} />

      {/* Сообщение от proxy.ts: сессия истекла по дороге, а не из-за ввода. */}
      {expired && !errors[FORM_ERROR] ? (
        <p className="rounded-card border border-line bg-muted px-3.5 py-3 text-[12.5px] leading-relaxed text-text-2">
          Сессия истекла — войдите снова.
        </p>
      ) : null}

      <FormError message={errors[FORM_ERROR]} />

      <Field label="Email" htmlFor="email" error={errors.email} required>
        <TextInput
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          autoFocus
          placeholder="admin@tabys.kz"
          error={errors.email}
        />
      </Field>

      <Field label="Пароль" htmlFor="password" error={errors.password} required>
        <TextInput
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          error={errors.password}
        />
      </Field>

      <SubmitButton pendingLabel="Входим…" className="w-full">
        Войти
      </SubmitButton>
    </form>
  );
}
