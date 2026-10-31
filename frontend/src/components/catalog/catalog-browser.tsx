"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { ChevronDown, Search } from "@/components/ui/icons";
import { CategoryChips, CategorySidebar } from "./category-sidebar";
import { CategoryCard } from "./category-card";
import { FilterPanel, emptyFilters, type Filters } from "./filter-panel";
import type { PublicCategory, PublicFacetGroup } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type Sort = "popular" | "name" | "count";

const sortLabels: Record<Sort, string> = {
  popular: "По популярности",
  name: "По названию А–Я",
  count: "По количеству позиций",
};

function matchesFilters(category: PublicCategory, filters: Filters) {
  return Object.entries(filters).every(([key, selected]) => {
    if (selected.length === 0) return true;
    const values = category.facets[key] ?? [];
    return values.some((v) => selected.includes(v));
  });
}

/**
 * Оглавление каталога: все категории с фильтрами и поиском. Категории
 * и фильтры приходят из админки (/public/*, см. lib/api/public.ts).
 *
 * У каждой категории и товара своя страница (app/(site)/oborudovanie/
 * [category]/...) — здесь только карточки-ссылки на них. Отбор и сортировка
 * остались на клиенте: категорий дюжина, и мгновенная реакция на галочку
 * лучше запроса на сервер за тем же списком.
 */
export function CatalogBrowser({
  categories,
  facetGroups,
}: {
  categories: PublicCategory[];
  facetGroups: PublicFacetGroup[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";

  const [filters, setFilters] = useState<Filters>(() => emptyFilters(facetGroups));
  const [sort, setSort] = useState<Sort>("popular");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  function search(q: string) {
    router.push(q ? `/oborudovanie?q=${encodeURIComponent(q)}` : "/oborudovanie", {
      scroll: false,
    });
  }

  function toggleFilter(key: string, value: string) {
    setFilters((cur) => {
      const selected = cur[key] ?? [];
      return {
        ...cur,
        [key]: selected.includes(value)
          ? selected.filter((v) => v !== value)
          : [...selected, value],
      };
    });
  }

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = categories.filter((category) => {
      if (!matchesFilters(category, filters)) return false;
      if (!needle) return true;
      return (
        category.title.toLowerCase().includes(needle) ||
        category.description.toLowerCase().includes(needle) ||
        category.items.some((item) => item.toLowerCase().includes(needle))
      );
    });

    if (sort === "name") return [...list].sort((a, b) => a.title.localeCompare(b.title, "ru"));
    if (sort === "count") return [...list].sort((a, b) => b.count - a.count);
    // «По популярности» — порядок из админки, его задаёт редактор перетаскиванием.
    return list;
  }, [categories, filters, query, sort]);

  return (
    <section className="bg-white py-12 lg:py-16">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <aside className="min-w-0 lg:col-span-3">
            <CategoryChips categories={categories} active={null} />

            <div className="hidden lg:block">
              <CategorySidebar categories={categories} active={null} />
            </div>

            <button
              type="button"
              aria-expanded={mobileFiltersOpen}
              onClick={() => setMobileFiltersOpen((v) => !v)}
              className="mt-5 flex h-11 w-full items-center justify-between rounded-card border border-line px-4 text-[13px] font-medium lg:hidden"
            >
              Фильтры
              <ChevronDown
                className={cn("size-4 text-text-2 transition-transform", mobileFiltersOpen && "rotate-180")}
              />
            </button>

            <div className={cn(mobileFiltersOpen ? "block" : "hidden", "lg:block")}>
              <FilterPanel
                groups={facetGroups}
                filters={filters}
                onToggle={toggleFilter}
                onReset={() => setFilters(emptyFilters(facetGroups))}
                resultCount={visible.length}
              />
            </div>
          </aside>

          <div className="min-w-0 lg:col-span-9">
            <div className="gap-10 lg:flex lg:items-start lg:justify-between">
              <div className="max-w-xl">
                <SectionLabel number="01">Catalog</SectionLabel>
                <h2 className="display-title mt-4 text-[clamp(1.5rem,4.5vw,2.25rem)] leading-[1.08]">
                  Все категории
                </h2>
              </div>

              <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row lg:mt-0 lg:w-auto">
                <SearchField value={query} onSubmit={search} />
                <label className="relative block">
                  <span className="sr-only">Сортировка</span>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as Sort)}
                    className="h-11 w-full cursor-pointer appearance-none rounded-card border border-line bg-white px-4 pr-10 text-[13px] focus:border-accent focus:outline-none sm:w-[220px]"
                  >
                    {(Object.keys(sortLabels) as Sort[]).map((key) => (
                      <option key={key} value={key}>
                        {sortLabels[key]}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-text-2" />
                </label>
              </div>
            </div>

            <p className="mt-6 max-w-2xl text-[14px] leading-relaxed text-text-2">
              Выберите интересующее оборудование или воспользуйтесь фильтрами для
              быстрого поиска. Если не нашли нужное решение — изготовим по вашему
              техническому заданию.
            </p>

            {visible.length > 0 ? (
              <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((category) => (
                  <li key={category.slug}>
                    <CategoryCard category={category} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-8 rounded-card border border-line bg-muted p-10 text-center">
                <p className="font-display text-[15px] font-bold uppercase">
                  Ничего не найдено
                </p>
                <p className="mx-auto mt-3 max-w-sm text-[13px] text-text-2">
                  Попробуйте изменить фильтры или поисковый запрос. Нужного решения нет
                  в каталоге? Изготовим по вашему техническому заданию.
                </p>
                <Button href="/kontakty" arrow className="mt-6">
                  Отправить ТЗ
                </Button>
              </div>
            )}

          </div>
        </div>
      </Container>
    </section>
  );
}

function SearchField({
  value,
  onSubmit,
}: {
  value: string;
  onSubmit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(draft.trim());
      }}
      className="relative"
    >
      <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-text-2" />
      <input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Поиск по оборудованию…"
        aria-label="Поиск по оборудованию"
        className="h-11 w-full rounded-card border border-line px-4 pr-10 text-[13px] placeholder:text-text-2 focus:border-accent focus:outline-none sm:w-[250px]"
      />
    </form>
  );
}
