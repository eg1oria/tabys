import Link from "next/link";
import { Modules } from "@/components/ui/icons";
import type { PublicCategory } from "@/lib/api/types";
import { categoryHref } from "@/lib/catalog-urls";
import { cn } from "@/lib/utils";

/**
 * Список категорий слева. Ссылки, а не кнопки: у каждой категории своя
 * страница, и поисковик должен пройти по ним так же, как посетитель.
 */
export function CategorySidebar({
  categories,
  active,
}: {
  categories: PublicCategory[];
  /** Слаг открытой категории; null — открыт весь каталог. */
  active: string | null;
}) {
  return (
    <nav aria-label="Категории оборудования">
      <ul className="space-y-1">
        <li>
          <Link
            href="/oborudovanie"
            aria-current={active === null ? "page" : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-card px-4 py-3 text-left text-[13px] transition-colors",
              active === null ? "bg-ink text-white" : "text-ink hover:bg-muted",
            )}
          >
            <Modules className="size-[18px] shrink-0 opacity-70" />
            <span className="flex-1 font-medium">Все оборудование</span>
            <span className={cn("text-[12px]", active === null ? "text-white/55" : "text-text-2")}>
              {categories.length}
            </span>
          </Link>
        </li>

        {categories.map((category) => {
          const isActive = active === category.slug;
          return (
            <li key={category.slug}>
              <Link
                href={categoryHref(category.slug)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-card px-4 py-3 text-left text-[13px] transition-colors",
                  isActive ? "bg-ink text-white" : "text-ink hover:bg-muted",
                )}
              >
                <span className="flex-1 leading-snug">{category.short}</span>
                <span className={cn("text-[12px]", isActive ? "text-white/55" : "text-text-2")}>
                  {category.count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** То же для узких экранов — горизонтальная лента чипов. */
export function CategoryChips({
  categories,
  active,
}: {
  categories: PublicCategory[];
  active: string | null;
}) {
  const chips = [
    { href: "/oborudovanie", label: "Все", count: categories.length, slug: null },
    ...categories.map((c) => ({
      href: categoryHref(c.slug),
      label: c.short,
      count: c.count,
      slug: c.slug,
    })),
  ];

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:hidden">
      <div className="flex w-max gap-2">
        {chips.map((chip) => {
          const isActive = active === chip.slug;
          return (
            <Link
              key={chip.href}
              href={chip.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-2 rounded-card border px-3.5 text-[12.5px] transition-colors",
                isActive ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-ink",
              )}
            >
              {chip.label}
              <span className={cn("text-[11px]", isActive ? "text-white/55" : "text-text-2")}>
                {chip.count}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
