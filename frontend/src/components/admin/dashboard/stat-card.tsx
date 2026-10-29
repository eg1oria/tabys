import { cn } from "@/lib/utils";

/**
 * Карточка показателя. Рост считается из настоящего предыдущего периода,
 * поэтому у карточек без сравнимой истории значка роста просто нет.
 */
export function StatCard({
  label,
  value,
  caption,
  delta,
  icon,
}: {
  label: string;
  value: string | number;
  caption?: string;
  delta?: { current: number; previous: number };
  icon: React.ReactNode;
}) {
  const change = delta ? percentChange(delta.current, delta.previous) : null;

  return (
    <article className="rounded-card border border-line bg-white p-5">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-card bg-accent/10 text-accent">
          {icon}
        </span>
        <h3 className="text-[13px] text-text-2">{label}</h3>
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-2.5">
        <span className="font-display text-[1.75rem] leading-none font-extrabold tracking-[-0.02em]">
          {typeof value === "number" ? value.toLocaleString("ru-RU") : value}
        </span>
        {change !== null ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold",
              change >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600",
            )}
          >
            <span aria-hidden>{change >= 0 ? "↑" : "↓"}</span>
            {Math.abs(change)}%
          </span>
        ) : null}
      </div>

      {caption ? <p className="mt-2 text-[12px] text-text-2">{caption}</p> : null}
    </article>
  );
}

/** Без базы сравнения проценты не считаем: «+100%» от нуля ничего не значит. */
function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
