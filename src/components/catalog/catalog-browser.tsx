"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { ImageSlot } from "@/components/ui/image-slot";
import { ArrowLeft, Check, ChevronDown, Search } from "@/components/ui/icons";
import { CategorySidebar } from "./category-sidebar";
import { CategoryCard } from "./category-card";
import { FilterPanel, emptyFilters, type Filters } from "./filter-panel";
import { categories, type Category, type FilterGroup } from "@/lib/content/categories";
import { cn } from "@/lib/utils";

type Sort = "popular" | "name" | "count";

const sortLabels: Record<Sort, string> = {
  popular: "По популярности",
  name: "По названию А–Я",
  count: "По количеству позиций",
};

function matchesFilters(category: Category, filters: Filters) {
  return (Object.keys(filters) as FilterGroup["key"][]).every((key) => {
    const selected = filters[key];
    if (selected.length === 0) return true;
    const value = category[key];
    return Array.isArray(value)
      ? value.some((v) => selected.includes(v))
      : selected.includes(value);
  });
}

export function CatalogBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeSlug = searchParams.get("cat");
  const query = searchParams.get("q") ?? "";

  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [sort, setSort] = useState<Sort>("popular");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const activeCategory = categories.find((c) => c.slug === activeSlug) ?? null;

  function updateParams(next: { cat?: string | null; q?: string | null }) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const qs = params.toString();
    router.push(qs ? `/oborudovanie?${qs}` : "/oborudovanie", { scroll: false });
  }

  function toggleFilter(key: FilterGroup["key"], value: string) {
    setFilters((cur) => ({
      ...cur,
      [key]: cur[key].includes(value)
        ? cur[key].filter((v) => v !== value)
        : [...cur[key], value],
    }));
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
    return list;
  }, [filters, query, sort]);

  return (
    <section className="bg-white py-12 lg:py-16">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <aside className="min-w-0 lg:col-span-3">
            <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:hidden">
              <div className="flex w-max gap-2">
                <CategoryChip
                  label="Все"
                  count={categories.length}
                  active={activeSlug === null}
                  onClick={() => updateParams({ cat: null })}
                />
                {categories.map((category) => (
                  <CategoryChip
                    key={category.slug}
                    label={category.short}
                    count={category.count}
                    active={activeSlug === category.slug}
                    onClick={() => updateParams({ cat: category.slug })}
                  />
                ))}
              </div>
            </div>

            <div className="hidden lg:block">
              <CategorySidebar
                active={activeSlug}
                onSelect={(slug) => updateParams({ cat: slug })}
              />
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
                filters={filters}
                onToggle={toggleFilter}
                onReset={() => setFilters(emptyFilters)}
                resultCount={visible.length}
              />
            </div>
          </aside>

          <div className="min-w-0 lg:col-span-9">
            {activeCategory ? (
              <CategoryDetail
                category={activeCategory}
                onBack={() => updateParams({ cat: null })}
              />
            ) : (
              <>
                <div className="gap-10 lg:flex lg:items-start lg:justify-between">
                  <div className="max-w-xl">
                    <SectionLabel number="01">Catalog</SectionLabel>
                    <h2 className="display-title mt-4 text-[clamp(1.5rem,4.5vw,2.25rem)] leading-[1.08]">
                      Все категории
                    </h2>
                  </div>

                  <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row lg:mt-0 lg:w-auto">
                    <SearchField
                      value={query}
                      onSubmit={(value) => updateParams({ q: value || null })}
                    />
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
                        <CategoryCard
                          category={category}
                          onSelect={() => updateParams({ cat: category.slug })}
                        />
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
              </>
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

function CategoryDetail({
  category,
  onBack,
}: {
  category: Category;
  onBack: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="group inline-flex items-center gap-2 text-[13px] font-medium text-accent"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        Все категории
      </button>

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-10">
        <ImageSlot
          src={category.image}
          alt={category.title}
          label={category.title}
          className="aspect-[4/3] w-full rounded-card"
          sizes="(max-width: 1024px) 100vw, 45vw"
        />

        <div>
          <SectionLabel>{category.count} позиций в категории</SectionLabel>
          <h2 className="display-title mt-4 text-[1.5rem] leading-[1.1] sm:text-[2rem]">
            {category.title}
          </h2>
          <p className="mt-5 text-[14px] leading-relaxed text-text-2">
            {category.description}
          </p>

          <ul className="mt-7 space-y-2.5 border-t border-line pt-6">
            {category.items.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[13.5px]">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/kontakty" arrow>
              Запросить подбор
            </Button>
            <Button href="/kontakty" variant="outline">
              Отправить ТЗ
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-2 rounded-card border px-3.5 text-[12.5px] transition-colors",
        active
          ? "border-ink bg-ink text-white"
          : "border-line bg-white text-ink hover:border-ink",
      )}
    >
      {label}
      <span className={cn("text-[11px]", active ? "text-white/55" : "text-text-2")}>
        {count}
      </span>
    </button>
  );
}
