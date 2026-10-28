import { SectionLabel } from "./section-label";
import { cn } from "@/lib/utils";

export function SectionHeader({
  number,
  label,
  title,
  description,
  action,
  className,
}: {
  number?: string;
  label: string;
  title: React.ReactNode;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-10 lg:mb-12", className)}>
      <SectionLabel number={number}>{label}</SectionLabel>
      <div className="mt-5 gap-10 lg:flex lg:items-end lg:justify-between">
        <h2 className="display-title max-w-xl text-[clamp(1.5rem,4.5vw,2.75rem)] leading-[1.08]">
          {title}
        </h2>
        {description || action ? (
          <div className="mt-5 flex shrink-0 flex-col items-start gap-4 lg:mt-0 lg:max-w-sm lg:items-end">
            {description ? (
              <p className="text-[14px] leading-relaxed text-text-2 lg:text-right">
                {description}
              </p>
            ) : null}
            {action}
          </div>
        ) : null}
      </div>
    </div>
  );
}
