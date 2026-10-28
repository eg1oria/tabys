"use client";

import { Modules } from "@/components/ui/icons";
import { categories } from "@/lib/content/categories";
import { cn } from "@/lib/utils";

export function CategorySidebar({
  active,
  onSelect,
}: {
  active: string | null;
  onSelect: (slug: string | null) => void;
}) {
  return (
    <nav aria-label="Категории оборудования">
      <ul className="space-y-1">
        <li>
          <button
            type="button"
            onClick={() => onSelect(null)}
            aria-current={active === null ? "true" : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-card px-4 py-3 text-left text-[13px] transition-colors",
              active === null
                ? "bg-ink text-white"
                : "text-ink hover:bg-muted",
            )}
          >
            <Modules className="size-[18px] shrink-0 opacity-70" />
            <span className="flex-1 font-medium">Все оборудование</span>
            <span className={cn("text-[12px]", active === null ? "text-white/55" : "text-text-2")}>
              {categories.length}
            </span>
          </button>
        </li>

        {categories.map((category) => {
          const isActive = active === category.slug;
          return (
            <li key={category.slug}>
              <button
                type="button"
                onClick={() => onSelect(category.slug)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-card px-4 py-3 text-left text-[13px] transition-colors",
                  isActive ? "bg-ink text-white" : "text-ink hover:bg-muted",
                )}
              >
                <span className="flex-1 leading-snug">{category.short}</span>
                <span
                  className={cn("text-[12px]", isActive ? "text-white/55" : "text-text-2")}
                >
                  {category.count}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
