import { cn } from "@/lib/utils";

export function SectionLabel({
  number,
  rule,
  children,
  className,
}: {
  number?: string;
  /** Тонкая линейка вправо до края колонки — как в макетах главной. */
  rule?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const text = (
    <p className={cn("section-label", rule ? "whitespace-nowrap" : null, rule ? null : className)}>
      {number ? (
        <>
          <span className="text-accent">{number}</span>
          {" / "}
        </>
      ) : null}
      {children}
    </p>
  );

  if (!rule) return text;

  return (
    <div className={cn("flex items-center gap-5", className)}>
      {text}
      <span aria-hidden className="h-px flex-1 bg-line" />
    </div>
  );
}
