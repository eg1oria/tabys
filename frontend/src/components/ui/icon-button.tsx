import { cn } from "@/lib/utils";

/**
 * Квадратная кнопка под иконку. aria-label обязателен: внутри только
 * иконка с aria-hidden, и без подписи кнопка не читается скринридером.
 */
export function IconButton({
  label,
  tone = "neutral",
  className,
  children,
  ...rest
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "aria-label"> & {
  label: string;
  tone?: "neutral" | "danger";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-grid size-8 place-items-center rounded-card border border-line bg-white transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:bg-white",
        tone === "danger"
          ? "text-text-2 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
          : "text-text-2 hover:border-ink hover:bg-muted hover:text-ink",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
