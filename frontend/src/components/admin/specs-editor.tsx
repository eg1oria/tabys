"use client";

import { useState } from "react";
import { TextInput } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { Plus, Trash } from "@/components/ui/icons";

type Row = { id: number; key: string; value: string };

let nextRowId = 0;

/**
 * Характеристики товара парами. Специально не текстареа с сырым JSON:
 * синтаксическая ошибка превращалась бы в 400, который редактору нечем
 * расшифровать. Server Action собирает пары обратно в объект.
 */
export function SpecsEditor({ specs }: { specs: Record<string, string> | null }) {
  const [rows, setRows] = useState<Row[]>(() => {
    const initial = Object.entries(specs ?? {}).map(([key, value]) => ({
      id: nextRowId++,
      key,
      value,
    }));
    return initial.length > 0 ? initial : [{ id: nextRowId++, key: "", value: "" }];
  });

  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div key={row.id} className="flex items-start gap-2">
          <span className="min-w-0 flex-1">
            <TextInput
              name="specKey"
              defaultValue={row.key}
              placeholder="Объём"
              aria-label={`Характеристика ${index + 1}: название`}
            />
          </span>
          <span className="min-w-0 flex-1">
            <TextInput
              name="specValue"
              defaultValue={row.value}
              placeholder="1 000 л"
              aria-label={`Характеристика ${index + 1}: значение`}
            />
          </span>
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
        onClick={() => setRows((cur) => [...cur, { id: nextRowId++, key: "", value: "" }])}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-accent hover:underline"
      >
        <Plus className="size-4" />
        Добавить характеристику
      </button>
    </div>
  );
}
