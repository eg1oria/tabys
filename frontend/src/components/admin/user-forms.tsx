"use client";

import { useActionState, useState } from "react";
import { Field, FieldError, FormError, Select, TextInput } from "@/components/ui/field";
import { SubmitButton } from "./submit-button";
import {
  createAdminUser,
  resetAdminPassword,
  updateAdminUser,
  type PasswordState,
} from "@/lib/admin/user-actions";
import { FORM_ERROR, initialFormState, str } from "@/lib/admin/form-state";
import type { AdminRole } from "@/lib/api/types";

const initialPasswordState: PasswordState = initialFormState;

/**
 * Временный пароль на экране. Второй раз его не получить — только сбросить
 * заново, поэтому предупреждаем прямо здесь.
 */
function TemporaryPassword({ who, password }: { who?: string; password: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      // Буфер обмена недоступен (http, запрет браузера) — пароль виден, скопируют руками.
    }
  }

  return (
    <div
      role="status"
      className="space-y-2 rounded-card border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-[12.5px] leading-relaxed text-emerald-800"
    >
      <p>
        Временный пароль{who ? ` для ${who}` : ""}. Передайте его лично и попросите сменить
        в «Настройках» — больше он нигде не появится.
      </p>
      <p className="flex flex-wrap items-center gap-3">
        <code className="rounded bg-white px-2 py-1 font-mono text-[13px] text-ink select-all">
          {password}
        </code>
        <button
          type="button"
          onClick={copy}
          className="text-[12px] font-medium underline underline-offset-2"
        >
          {copied ? "Скопировано" : "Скопировать"}
        </button>
      </p>
    </div>
  );
}

export function CreateUserForm() {
  const [state, formAction] = useActionState(createAdminUser, initialPasswordState);
  const errors = state.errors;

  return (
    <div className="space-y-4">
      {state.status === "success" && state.password ? (
        <TemporaryPassword who={state.email} password={state.password} />
      ) : null}

      <form key={state.submissionId} action={formAction} noValidate className="space-y-4">
        <FormError message={errors[FORM_ERROR]} />

        <Field label="Имя" htmlFor="name" error={errors.name} required>
          <TextInput
            id="name"
            name="name"
            defaultValue={str(state.values, "name")}
            autoComplete="off"
            error={errors.name}
          />
        </Field>

        <Field label="Email — им входят в админку" htmlFor="email" error={errors.email} required>
          <TextInput
            id="email"
            name="email"
            type="email"
            defaultValue={str(state.values, "email")}
            autoComplete="off"
            spellCheck={false}
            error={errors.email}
          />
        </Field>

        <Field label="Роль" htmlFor="role" error={errors.role} required>
          <Select
            id="role"
            name="role"
            defaultValue={str(state.values, "role") ?? "EDITOR"}
            error={errors.role}
          >
            <option value="EDITOR">Редактор</option>
            <option value="OWNER">Владелец</option>
          </Select>
        </Field>

        <SubmitButton pendingLabel="Создаём…">Создать и получить пароль</SubmitButton>
      </form>
    </div>
  );
}

const actionButton =
  "inline-flex h-8 items-center rounded-card border border-line bg-white px-3 text-[12px] font-medium text-ink transition-colors hover:border-ink hover:bg-muted";

/** Роль, доступ и сброс пароля — каждое своей маленькой формой. */
export function UserActions({
  id,
  name,
  role,
  isActive,
}: {
  id: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
}) {
  const [updateState, update] = useActionState(updateAdminUser, initialFormState);
  const [resetState, reset] = useActionState(resetAdminPassword, initialPasswordState);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <form action={update}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="role" value={role === "OWNER" ? "EDITOR" : "OWNER"} />
          <SubmitButton variant="outline" className="h-8 px-3 text-[12px]" pendingLabel="Меняем…">
            {role === "OWNER" ? "Сделать редактором" : "Сделать владельцем"}
          </SubmitButton>
        </form>

        <form action={update}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="isActive" value={isActive ? "false" : "true"} />
          <SubmitButton
            variant="outline"
            className={`h-8 px-3 text-[12px] ${isActive ? "text-red-600" : ""}`}
            pendingLabel="Меняем…"
          >
            {isActive ? "Отключить вход" : "Включить вход"}
          </SubmitButton>
        </form>

        {isActive ? (
          <form action={reset} className="flex items-center gap-2">
            <input type="hidden" name="id" value={id} />
            {confirmReset ? (
              <>
                <SubmitButton
                  variant="outline"
                  className="h-8 px-3 text-[12px] text-red-600"
                  pendingLabel="Сбрасываем…"
                >
                  Сбросить и завершить его сессии
                </SubmitButton>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="text-[12px] text-text-2 hover:text-ink"
                >
                  Отмена
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setConfirmReset(true)} className={actionButton}>
                Сбросить пароль
              </button>
            )}
          </form>
        ) : null}
      </div>

      <FieldError message={updateState.errors[FORM_ERROR] ?? resetState.errors[FORM_ERROR]} />
      {resetState.status === "success" && resetState.password ? (
        <TemporaryPassword who={name} password={resetState.password} />
      ) : null}
    </div>
  );
}
