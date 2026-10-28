import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <Link
      href="/"
      aria-label="Tabys Consulting — на главную"
      className={cn("group block shrink-0 leading-none", className)}
    >
      <span
        className={cn(
          "block font-display text-[21px] font-extrabold tracking-[0.02em] sm:text-[23px]",
          tone === "light" ? "text-white" : "text-ink",
        )}
      >
        TABYS
      </span>
      <span
        className={cn(
          "mt-1 block font-display text-[10px] font-semibold tracking-[0.42em]",
          tone === "light" ? "text-white/60" : "text-text-2",
        )}
      >
        CONSULTING
      </span>
    </Link>
  );
}
