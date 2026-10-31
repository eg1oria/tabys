"use client";

import { useState } from "react";
import { TextInput } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { ChevronDown, ChevronUp, Plus, Trash } from "@/components/ui/icons";
import type { ProductSpec } from "@/lib/api/types";

type Row = ProductSpec & { id: number };

let nextRowId = 0;

function emptyRow(): Row {
  return { id: nextRowId++, key: "", value: "" };
}

/**
 * Характеристики товара парами, по порядку: в каком порядке строки здесь,
 * в таком их увидит посетитель. Специально не текстареа с сырым JSON:
 * синтаксическая ошибка превращалась бы в 400, который редактору нечем
 * расшифровать. Server Action собирает пары обратно в массив.
 *
 * После неудачного сохранения форма перемонтируется (key={submissionId}
 * в product-form) и передаёт сюда отправленные строки — так ввод не
 * пропадает вместе с ошибкой. React 19 сбрасывает поля формы после любого
 * действия, поэтому восстанавливать нужно именно так, а не состоянием.
 */
export function SpecsEditor({ specs }: { specs: ProductSpec[] | null }) {
  const [rows, setRows] = useState<Row[]>(() => {
    const initial = (specs ?? []).map((spec) => ({ id: nextRowId++, ...spec }));
    return initial.length > 0 ? initial : [emptyRow()];
  });

  function update(id: number, patch: Partial<ProductSpec>) {
    setRows((cur) => cur.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function move(index: number, delta: -1 | 1) {
    setRows((cur) => {
      const target = index + delta;
      if (target < 0 || target >= cur.length) return cur;
      const next = [...cur];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div key={row.id} className="flex items-start gap-2">
          <span className="min-w-0 flex-1">
            <TextInput
              name="specKey"
              value={row.key}
              onChange={(e) => update(row.id, { key: e.target.value })}
              placeholder="Объём"
              maxLength={100}
              aria-label={`Характеристика ${index + 1}: название`}
            />
          </span>
          <span className="min-w-0 flex-1">
            <TextInput
              name="specValue"
              value={row.value}
              onChange={(e) => update(row.id, { value: e.target.value })}
              placeholder="1 000 л"
              maxLength={300}
              aria-label={`Характеристика ${index + 1}: значение`}
            />
          </span>
          <IconButton
            label={`Поднять характеристику ${index + 1}`}
            className="mt-1"
            disabled={index === 0}
            onClick={() => move(index, -1)}
          >
            <ChevronUp className="size-4" />
          </IconButton>
          <IconButton
            label={`Опустить характеристику ${index + 1}`}
            className="mt-1"
            disabled={index === rows.length - 1}
            onClick={() => move(index, 1)}
          >
            <ChevronDown className="size-4" />
          </IconButton>
          <IconButton
            label={`Удалить характеристику ${index + 1}`}
            tone="danger"
            className="mt-1"
            onClick={() => setRows((cur) => cur.filter((item) => item.id !== row.id))}
          >
            <Trash className="size-4" />
          </IconButton>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setRows((cur) => [...cur, emptyRow()])}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-accent hover:underline"
      >
        <Plus className="size-4" />
        Добавить характеристику
      </button>
    </div>
  );
}
