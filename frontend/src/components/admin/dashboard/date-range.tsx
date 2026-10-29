import Link from "next/link";
import { Calendar } from "@/components/ui/icons";
import { fieldBase, fieldBorder } from "@/components/ui/field";
import { cn } from "@/lib/utils";

/**
 * Период сводки. Нативная GET-форма: выбранные даты уходят в адрес,
 * страница пересчитывается на сервере — ни состояния, ни календаря
 * собственной сборки.
 */
export function DateRange({
  from,
  to,
  presets,
}: {
  from: string;
  to: string;
  presets: { label: string; from: string; to: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1">
        {presets.map((preset) => {
          const active = preset.from === from && preset.to === to;
          return (
            <Link
              key={preset.label}
              href={`/admin?from=${preset.from}&to=${preset.to}`}
              prefetch={false}
              className={cn(
                "inline-flex h-9 items-center rounded-card border px-3 text-[12.5px] font-medium transition-colors",
                active
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-line bg-white text-text-2 hover:border-ink hover:text-ink",
              )}
            >
              {preset.label}
            </Link>
          );
        })}
      </div>

      <form action="/admin" method="get" className="flex items-center gap-2">
        <Calendar className="size-4 shrink-0 text-text-2" />
        <label htmlFor="from" className="sr-only">
          Начало периода
        </label>
        <input
          id="from"
          type="date"
          name="from"
          defaultValue={from}
          max={to}
          className={cn(fieldBase, "h-9 w-auto", fieldBorder(false))}
        />
        <span aria-hidden className="text-text-2">
          —
        </span>
        <label htmlFor="to" className="sr-only">
          Конец периода
        </label>
        <input
          id="to"
          type="date"
          name="to"
          defaultValue={to}
          min={from}
          className={cn(fieldBase, "h-9 w-auto", fieldBorder(false))}
        />
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-card border border-line bg-white px-3.5 text-[12.5px] font-medium transition-colors hover:border-ink hover:bg-muted"
        >
          Показать
        </button>
      </form>
    </div>
  );
}
