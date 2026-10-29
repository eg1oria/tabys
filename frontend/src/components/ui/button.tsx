import Link from "next/link";
import { ArrowRight } from "./icons";
import { cn } from "@/lib/utils";

type Variant = "primary" | "dark" | "outline" | "outlineLight";
type Size = "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-strong",
  dark: "bg-ink text-white hover:bg-ink-soft",
  outline: "border border-line bg-white text-ink hover:border-ink hover:bg-muted",
  outlineLight: "border border-white/25 text-white hover:border-white/60 hover:bg-white/10",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-[13px]",
  lg: "h-[52px] px-7 text-sm",
};

type Props = {
  href?: string;
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export function Button({
  href,
  variant = "primary",
  size = "md",
  arrow = false,
  className,
  children,
  ...rest
}: Props) {
  const classes = cn(
    "group inline-flex items-center justify-center gap-2.5 rounded-card font-medium transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    variants[variant],
    sizes[size],
    className,
  );

  const content = (
    <>
      {children}
      {arrow ? (
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} {...rest}>
      {content}
    </button>
  );
}
