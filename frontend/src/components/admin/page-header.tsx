import Link from "next/link";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

/**
 * Крошки приходят пропсом, а не выводятся из pathname: на страницах вида
 * /catalog/products/[id] путь состоит из идентификатора и соврал бы.
 */
function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Хлебные крошки" className="mb-2">
      <ol className="flex flex-wrap items-center gap-1.5 text-[12px] text-text-2">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1.5">
            {i > 0 ? <span aria-hidden>/</span> : null}
            {item.href ? (
              <Link href={item.href} prefetch={false} className="transition-colors hover:text-ink">
                {item.label}
              </Link>
            ) : (
              <span className="text-ink">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: {
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-4 bg-white px-5 py-6 lg:px-8",
        className,
      )}
    >
      <div className="min-w-0">
        {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}
        <h1 className="font-display text-[1.75rem] leading-tight font-extrabold tracking-[-0.01em]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 text-[13px] leading-relaxed text-text-2">{description}</p>
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
