"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

/**
 * Кнопка удаления внутри чужой формы.
 *
 * Своей <form> у неё нет осознанно: вложенные формы запрещены в HTML,
 * браузер выбрасывает внутреннюю, и React валится с ошибкой гидратации —
 * вместе с ней перестаёт работать весь клиентский код панели.
 * Вместо этого отправляем ту же форму другим действием через formAction.
 */
export function DeleteSubmit({
  action,
  label = "Удалить",
  confirmLabel = "Точно удалить",
}: {
  action: (formData: FormData) => void;
  label?: string;
  confirmLabel?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const confirm = useRef<HTMLButtonElement>(null);
  const { pending } = useFormStatus();

  // Кнопка подтверждения подменяет исходную — без переноса фокуса
  // с клавиатуры удалить было бы нельзя.
  useEffect(() => {
    if (confirming) confirm.current?.focus();
  }, [confirming]);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex h-10 items-center gap-2 rounded-card border border-line px-3.5 text-[12.5px] font-medium text-text-2 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600"
      >
        {label}
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <button
        ref={confirm}
        type="submit"
        formAction={action}
        disabled={pending}
        className="inline-flex h-10 items-center rounded-card border border-red-300 bg-red-50 px-3.5 text-[12.5px] font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60"
      >
        {confirmLabel}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-[12px] text-text-2 hover:text-ink"
      >
        Отмена
      </button>
    </span>
  );
}
