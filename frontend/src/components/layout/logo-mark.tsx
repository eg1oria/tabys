import { cn } from "@/lib/utils";

/**
 * Знак «Т-кран»: буква Т — трубопровод, из неё падает капля.
 * Тот же рисунок лежит в app/icon.svg (фавикон) — меняйте оба.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={cn("shrink-0", className)}>
      <rect width="40" height="40" rx="10" fill="var(--color-accent)" />
      <path
        d="M11 11.5h18M20 11.5v12"
        stroke="#fff"
        strokeWidth="4.2"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M20 27.5s-3 3.6-3 5.6a3 3 0 0 0 6 0c0-2-3-5.6-3-5.6Z" fill="#fff" />
    </svg>
  );
}
