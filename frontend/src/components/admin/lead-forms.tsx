"use client";

import { useActionState } from "react";
import { FormError, Select, TextArea } from "@/components/ui/field";
import { SubmitButton } from "./submit-button";
import { assignLead, saveInternalNote, updateLeadStatus } from "@/lib/admin/lead-actions";
import { FORM_ERROR, initialFormState } from "@/lib/admin/form-state";
import { LEAD_TRANSITIONS, LEAD_TRANSITION_LABEL } from "@/lib/admin/lead-status";
import type { AdminUserOption, LeadStatus } from "@/lib/api/types";

/**
 * Переходы статуса. Одна форма с несколькими кнопками submit под общим
 * именем status: так на все переходы хватает одного useActionState,
 * и ошибка бэкенда показывается рядом с кнопками, а не улетает в консоль.
 */
export function LeadStatusForm({ id, status }: { id: string; status: LeadStatus }) {
  const [state, formAction] = useActionState(updateLeadStatus, initialFormState);
  const allowed = LEAD_TRANSITIONS[status];

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <FormError message={state.errors[FORM_ERROR]} />

      {allowed.length === 0 ? (
        <p className="text-[12.5px] text-text-2">Из этого статуса переходов нет.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {allowed.map((next) => (
            <SubmitButton
              key={next}
              name="status"
              value={next}
              variant={next === "SPAM" ? "outline" : next === "DONE" ? "dark" : "primary"}
              pendingLabel="Меняем…"
            >
              {LEAD_TRANSITION_LABEL[next]}
            </SubmitButton>
          ))}
        </div>
      )}
    </form>
  );
}

export function LeadNoteForm({ id, note }: { id: string; note: string | null }) {
  const [state, formAction] = useActionState(saveInternalNote, initialFormState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <FormError message={state.errors[FORM_ERROR]} />

      <TextArea
        name="internalNote"
        defaultValue={note ?? ""}
        rows={5}
        placeholder="Что сделано, о чём договорились, что уточнить"
        error={state.errors.internalNote}
      />

      <div className="flex items-center gap-3">
        <SubmitButton variant="outline">Сохранить заметку</SubmitButton>
        {state.status === "success" ? (
          <span className="text-[12.5px] text-emerald-600">Сохранено</span>
        ) : null}
      </div>
    </form>
  );
}

export function LeadAssignForm({
  id,
  assignedToId,
  admins,
}: {
  id: string;
  assignedToId: string | null;
  admins: AdminUserOption[];
}) {
  const [state, formAction] = useActionState(assignLead, initialFormState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <FormError message={state.errors[FORM_ERROR]} />

      <Select name="assignedToId" defaultValue={assignedToId ?? ""} aria-label="Ответственный">
        <option value="">Не назначен</option>
        {admins.map((admin) => (
          <option key={admin.id} value={admin.id}>
            {admin.name}
          </option>
        ))}
      </Select>

      <SubmitButton variant="outline">Назначить</SubmitButton>
    </form>
  );
}
