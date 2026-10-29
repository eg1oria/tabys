import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-4 border-b border-line bg-white px-5 py-5 lg:px-8",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="display-title text-[1.2rem]">{title}</h1>
        {description ? (
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-text-2">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** Белая карточка — основной контейнер содержимого на сером фоне админки. */
export function Panel({
  title,
  actions,
  className,
  children,
}: {
  title?: string;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-card border border-line bg-white", className)}>
      {title || actions ? (
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
          {title ? <h2 className="section-label">{title}</h2> : <span />}
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="px-5 py-14 text-center">
      <p className="text-[13.5px] font-medium">{message}</p>
      {hint ? <p className="mx-auto mt-2 max-w-sm text-[12.5px] text-text-2">{hint}</p> : null}
    </div>
  );
}
