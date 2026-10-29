import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Пагинация ссылками, а не кнопками: список — серверный компонент,
 * useSearchParams не нужен, а значит не нужен и <Suspense> вокруг него.
 */
export function Pagination({
  basePath,
  params,
  meta,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  meta: { page: number; perPage: number; total: number; totalPages: number };
}) {
  if (meta.totalPages <= 1) return null;

  const href = (page: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value && key !== "page") search.set(key, value);
    }
    if (page > 1) search.set("page", String(page));
    const query = search.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  const from = (meta.page - 1) * meta.perPage + 1;
  const to = Math.min(meta.page * meta.perPage, meta.total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
      <p className="text-[12.5px] text-text-2">
        {from}–{to} из {meta.total}
      </p>

      <div className="flex items-center gap-2">
        <PageLink href={href(meta.page - 1)} disabled={meta.page <= 1}>
          Назад
        </PageLink>
        <span className="text-[12.5px] text-text-2">
          {meta.page} / {meta.totalPages}
        </span>
        <PageLink href={href(meta.page + 1)} disabled={meta.page >= meta.totalPages}>
          Вперёд
        </PageLink>
      </div>
    </div>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const classes = cn(
    "inline-flex h-8 items-center rounded-card border px-3 text-[12.5px] font-medium transition-colors",
    disabled
      ? "cursor-not-allowed border-line text-text-2 opacity-50"
      : "border-line hover:border-ink hover:bg-muted",
  );

  if (disabled) {
    return (
      <span aria-disabled="true" className={classes}>
        {children}
      </span>
    );
  }

  return (
    <Link href={href} prefetch={false} className={classes}>
      {children}
    </Link>
  );
}
