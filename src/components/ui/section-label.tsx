import { cn } from "@/lib/utils";

export function SectionLabel({
  number,
  children,
  className,
}: {
  number?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("section-label", className)}>
      {number ? `${number} / ` : null}
      {children}
    </p>
  );
}
