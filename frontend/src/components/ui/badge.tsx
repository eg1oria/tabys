import { cn } from "@/lib/utils";

/**
 * Статусы в таблицах. Палитра Tailwind, а не токены темы: статусных
 * цветов четыре, и в @theme сайта им не место — публичные страницы
 * их не используют.
 */
export type Tone = "neutral" | "accent" | "warn" | "ok" | "danger";

const tones: Record<Tone, string> = {
  neutral: "border-line bg-muted text-text-2",
  accent: "border-accent/25 bg-accent/10 text-accent-strong",
  warn: "border-amber-200 bg-amber-50 text-amber-700",
  ok: "border-emerald-200 bg-emerald-50 text-emerald-700",
  danger: "border-red-200 bg-red-50 text-red-700",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-card border px-2 py-0.5 text-[11.5px] font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
