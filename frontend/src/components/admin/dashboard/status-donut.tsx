import Link from "next/link";
import { LEAD_STATUSES, LEAD_STATUS_LABEL } from "@/lib/admin/lead-status";
import type { LeadStatusCounts } from "@/lib/api/types";

const R = 56;
const C = 2 * Math.PI * R;

/** Цвета дуг — те же, что у пилюль статуса, но в явных значениях. */
const COLOR: Record<string, string> = {
  NEW: "var(--color-accent)",
  IN_PROGRESS: "#f59e0b",
  DONE: "#10b981",
  SPAM: "#cbd5e1",
};

/**
 * Кольцо «Заявки по статусам».
 *
 * На макете здесь были «Источники заявок», но источник обращения нигде
 * не сохраняется — ни UTM, ни referrer в модели Lead нет. Рисовать
 * выдуманные доли нельзя, поэтому показываем то, что есть на самом деле.
 */
export function StatusDonut({ counts }: { counts: LeadStatusCounts }) {
  const total = LEAD_STATUSES.reduce((sum, status) => sum + counts[status], 0);

  const shares = LEAD_STATUSES.map((status) => (total === 0 ? 0 : counts[status] / total));
  // Смещение дуги — сумма предыдущих долей: считаем без накопителя,
  // чтобы не менять переменную по ходу отрисовки.
  const arcs = LEAD_STATUSES.map((status, index) => ({
    status,
    share: shares[index],
    dash: shares[index] * C,
    offset: shares.slice(0, index).reduce((sum, share) => sum + share, 0) * C,
  }));

  return (
    <div className="flex flex-wrap items-center gap-6 px-5 py-5">
      <div className="relative shrink-0">
        <svg viewBox="0 0 140 140" className="size-[140px] -rotate-90" role="presentation">
          <circle cx="70" cy="70" r={R} fill="none" stroke="var(--color-line)" strokeWidth="16" />
          {arcs.map((arc) =>
            arc.share > 0 ? (
              <circle
                key={arc.status}
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke={COLOR[arc.status]}
                strokeWidth="16"
                strokeDasharray={`${arc.dash} ${C - arc.dash}`}
                strokeDashoffset={-arc.offset}
              />
            ) : null,
          )}
        </svg>
        <span className="absolute inset-0 grid place-items-center text-center">
          <span>
            <span className="block font-display text-[1.4rem] leading-none font-extrabold">
              {total}
            </span>
            <span className="mt-1 block text-[11px] text-text-2">всего</span>
          </span>
        </span>
      </div>

      <ul className="min-w-[150px] flex-1 space-y-2.5">
        {LEAD_STATUSES.map((status) => (
          <li key={status}>
            <Link
              href={`/admin/leads?status=${status}`}
              prefetch={false}
              className="flex items-center gap-2.5 text-[13px] transition-colors hover:text-accent"
            >
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: COLOR[status] }}
              />
              <span className="min-w-0 flex-1 truncate">{LEAD_STATUS_LABEL[status]}</span>
              <span className="shrink-0 font-medium">{counts[status]}</span>
              <span className="w-10 shrink-0 text-right text-[12px] text-text-2">
                {total === 0 ? "0%" : `${Math.round((counts[status] / total) * 100)}%`}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
