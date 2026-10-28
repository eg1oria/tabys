"use client";

import { useState } from "react";
import { ChevronDown } from "@/components/ui/icons";
import { filterGroups, type FilterGroup } from "@/lib/content/categories";
import { cn } from "@/lib/utils";

export type Filters = Record<FilterGroup["key"], string[]>;

export const emptyFilters: Filters = {
  type: [],
  volume: [],
  productivity: [],
  material: [],
  application: [],
};

export function FilterPanel({
  filters,
  onToggle,
  onReset,
  resultCount,
}: {
  filters: Filters;
  onToggle: (key: FilterGroup["key"], value: string) => void;
  onReset: () => void;
  resultCount: number;
}) {
  const [open, setOpen] = useState<string[]>(["type"]);
  const activeCount = Object.values(filters).reduce((n, list) => n + list.length, 0);

  return (
    <div className="mt-8 border-t border-line pt-7">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-[15px] font-bold uppercase tracking-[0.02em]">
          Фильтры
        </h2>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={onReset}
            className="text-[12px] font-medium text-accent hover:underline"
          >
            Сбросить
          </button>
        ) : null}
      </div>

      <div className="mt-4">
        {filterGroups.map((group) => {
          const isOpen = open.includes(group.key);
          return (
            <div key={group.key} className="border-b border-line">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() =>
                  setOpen((cur) =>
                    cur.includes(group.key)
                      ? cur.filter((k) => k !== group.key)
                      : [...cur, group.key],
                  )
                }
                className="flex w-full items-center justify-between py-3.5 text-left text-[13px] font-medium"
              >
                <span>
                  {group.title}
                  {filters[group.key].length > 0 ? (
                    <span className="ml-2 text-accent">{filters[group.key].length}</span>
                  ) : null}
                </span>
                <ChevronDown
                  className={cn("size-4 text-text-2 transition-transform", isOpen && "rotate-180")}
                />
              </button>

              {isOpen ? (
                <ul className="space-y-2.5 pb-4">
                  {group.options.map((option) => {
                    const checked = filters[group.key].includes(option.value);
                    return (
                      <li key={option.value}>
                        <label className="flex cursor-pointer items-start gap-2.5 text-[13px] text-text-2 transition-colors hover:text-ink">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => onToggle(group.key, option.value)}
                            className="mt-0.5 size-4 shrink-0 accent-accent"
                          />
                          <span className={cn(checked && "text-ink")}>{option.label}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Фильтрация мгновенная, поэтому здесь счётчик, а не кнопка «Показать»:
          кнопка выглядела бы кликабельной и ничего не делала. */}
      <p aria-live="polite" className="mt-6 flex h-11 items-center justify-center rounded-card bg-muted px-5 text-[13px] text-text-2">
        Найдено категорий:&nbsp;<span className="font-semibold text-ink">{resultCount}</span>
      </p>
      <button
        type="button"
        onClick={onReset}
        disabled={activeCount === 0}
        className="mt-3 h-11 w-full rounded-card border border-line text-[13px] font-medium transition-colors hover:border-ink hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-line disabled:hover:bg-transparent"
      >
        Сбросить фильтры
      </button>
    </div>
  );
}
