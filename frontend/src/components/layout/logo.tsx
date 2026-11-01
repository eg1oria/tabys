import Link from "next/link";
import { cn } from "@/lib/utils";
import { LogoMark } from "./logo-mark";

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
      aria-label="Табыс Consulting — на главную"
      className={cn("group flex shrink-0 items-center gap-2.5 leading-none", className)}
    >
      <LogoMark className="size-9 sm:size-10" />
      <span className="block">
        <span
          className={cn(
            "block font-display text-[21px] font-extrabold tracking-[0.02em] sm:text-[23px]",
            tone === "light" ? "text-white" : "text-ink",
          )}
        >
          ТАБЫС
        </span>
        <span
          className={cn(
            "mt-1 block font-display text-[10px] font-semibold tracking-[0.42em]",
            tone === "light" ? "text-white/60" : "text-text-2",
          )}
        >
          CONSULTING
        </span>
      </span>
    </Link>
  );
}
