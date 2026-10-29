import Link from "next/link";
import { Plus } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import type { AdminCategory } from "@/lib/api/types";

/**
 * Боковой список категорий. Активная определяется на сервере сравнением
 * со slug из адреса — клиентский компонент для этого не нужен.
 */
export function CategoryRail({
  categories,
  active,
  hrefFor,
  total,
}: {
  categories: AdminCategory[];
  active?: string;
  hrefFor: (slug?: string) => string;
  total: number;
}) {
  return (
    <section className="rounded-card border border-line bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 className="font-display text-[14px] font-bold">Категории</h2>
        <Link
          href="/admin/catalog/categories/new"
          prefetch={false}
          aria-label="Новая категория"
          title="Новая категория"
          className="grid size-7 place-items-center rounded-card border border-line text-text-2 transition-colors hover:border-accent hover:text-accent"
        >
          <Plus className="size-4" />
        </Link>
      </div>

      <ul className="p-2">
        <li>
          <Row href={hrefFor()} label="Все товары" count={total} active={!active} />
        </li>
        {categories.map((category) => (
          <li key={category.id}>
            <Row
              href={hrefFor(category.slug)}
              label={category.title}
              count={category._count.products}
              active={active === category.slug}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Row({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-card px-2.5 py-2 text-[13px] transition-colors",
        active ? "bg-accent/10 font-medium text-accent" : "text-ink hover:bg-muted",
      )}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className={cn("shrink-0 text-[12px]", active ? "text-accent" : "text-text-2")}>
        {count}
      </span>
    </Link>
  );
}
