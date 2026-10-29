"use client";

import { useActionState, useState } from "react";
import { FormError } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { ChevronDown, ChevronUp } from "@/components/ui/icons";
import { SubmitButton } from "./submit-button";
import { FORM_ERROR, initialFormState, type FormState } from "@/lib/admin/form-state";

export type ReorderItem = { id: string; title: string };

/**
 * Порядок меняется кнопками, а не перетаскиванием: drag-and-drop требует
 * библиотеки, а работает только мышью. Стрелки доступны с клавиатуры и
 * понятны без объяснений.
 *
 * Отправляем весь список целиком — бэкенд применяет его одной транзакцией,
 * поэтому наполовину переставленного каталога не бывает.
 */
export function ReorderList({
  items,
  action,
}: {
  items: ReorderItem[];
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction] = useActionState(action, initialFormState);
  const [order, setOrder] = useState(items);
  // Список приходит с сервера и меняется после удаления или добавления.
  // Без пересинхронизации форма продолжала бы слать id удалённых записей.
  const [knownItems, setKnownItems] = useState(items);
  if (knownItems !== items) {
    setKnownItems(items);
    setOrder(items);
  }
  const dirty = order.some((item, index) => item.id !== items[index]?.id);

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    setOrder((cur) => {
      const next = [...cur];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <form action={formAction} className="space-y-3 px-4 py-4">
      <FormError message={state.errors[FORM_ERROR]} />

      <ol className="divide-y divide-line rounded-card border border-line">
        {order.map((item, index) => (
          <li key={item.id} className="flex items-center gap-3 px-3 py-2">
            <input type="hidden" name="order" value={item.id} />
            <span className="w-6 shrink-0 text-[12px] text-text-2">{index + 1}</span>
            <span className="min-w-0 flex-1 truncate text-[13px]">{item.title}</span>
            <IconButton
              label={`Переместить «${item.title}» выше`}
              disabled={index === 0}
              onClick={() => move(index, -1)}
            >
              <ChevronUp className="size-4" />
            </IconButton>
            <IconButton
              label={`Переместить «${item.title}» ниже`}
              disabled={index === order.length - 1}
              onClick={() => move(index, 1)}
            >
              <ChevronDown className="size-4" />
            </IconButton>
          </li>
        ))}
      </ol>

      <div className="flex items-center gap-3">
        <SubmitButton disabled={!dirty} pendingLabel="Сохраняем…">
          Сохранить порядок
        </SubmitButton>
        {dirty ? (
          <span className="text-[12.5px] text-text-2">Порядок изменён — не забудьте сохранить</span>
        ) : state.status === "success" ? (
          <span className="text-[12.5px] text-emerald-600">Порядок сохранён</span>
        ) : null}
      </div>
    </form>
  );
}
