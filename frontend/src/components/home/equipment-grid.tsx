import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { ImageSlot } from "@/components/ui/image-slot";
import { ArrowRight, Check } from "@/components/ui/icons";
import { getCategories } from "@/lib/api/public";
import { categoryHref } from "@/lib/catalog-urls";

/**
 * Первые шесть опубликованных категорий в порядке из админки: первая —
 * крупной карточкой с пунктами highlights, остальные — сеткой.
 * На главной стоит под <Suspense>: см. «Сборка от бэкенда не зависит»
 * в lib/api/public.ts.
 */
export async function EquipmentGrid() {
  const [featured, ...rest] = await getCategories();
  // Бэкенд недоступен — блок не рисуем, а не показываем пустую сетку.
  if (!featured) return null;
  const secondary = rest.slice(0, 5);

  return (
    <section className="bg-muted py-16 lg:py-24">
      <Container>
        <SectionHeader
          number="01"
          label="Оборудование"
          title={
            <>
              Наше
              <br />
              оборудование
            </>
          }
          description="Производим широкий спектр оборудования для переработки и производства пищевой продукции."
          action={
            <Link
              href="/oborudovanie"
              className="group inline-flex items-center gap-2 text-[13px] font-medium text-accent"
            >
              Перейти в каталог
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          }
        />

        <div className="grid gap-4 lg:grid-cols-12">
          {/* Крупная карточка */}
          <Link
            href={categoryHref(featured.slug)}
            className="group relative flex flex-col overflow-hidden rounded-card bg-ink p-7 text-white lg:col-span-4"
          >
            <h3 className="display-title text-[1.5rem] leading-tight">{featured.title}</h3>

            <ul className="mt-6 space-y-2.5">
              {featured.highlights.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-[13px] text-white/70">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-accent" />
                  {point}
                </li>
              ))}
            </ul>

            <ImageSlot
              src={featured.image?.url}
              alt={featured.image?.alt || featured.title}
              label={featured.title}
              blurDataUrl={featured.image?.blurDataUrl}
              className="mt-7 aspect-[4/3] w-full rounded-card"
              imageClassName="transition-transform duration-500 group-hover:scale-[1.04]"
              sizes="(max-width: 1024px) 100vw, 33vw"
            />

            <span className="mt-6 grid size-11 shrink-0 place-items-center rounded-card bg-accent text-white transition-colors group-hover:bg-white group-hover:text-ink">
              <ArrowRight className="size-5" />
            </span>
          </Link>

          {/* Шесть ячеек: две широкие сверху, три снизу */}
          <div className="grid gap-4 sm:grid-cols-6 lg:col-span-8">
            {secondary.map((category, i) => (
              <Link
                key={category.slug}
                href={categoryHref(category.slug)}
                className={`group flex flex-col rounded-card border border-line bg-white p-5 transition-colors hover:border-accent ${
                  i < 2 ? "sm:col-span-3" : "sm:col-span-2"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="min-h-[2.7em] font-display text-[13px] font-bold uppercase leading-[1.35] tracking-[0.02em]">
                    {category.title}
                  </h3>
                  <span className="shrink-0 text-[11px] font-semibold text-text-2">
                    {String(i + 2).padStart(2, "0")}
                  </span>
                </div>

                <ImageSlot
                  src={category.image?.url}
                  alt={category.image?.alt || category.title}
                  label={category.title}
                  blurDataUrl={category.image?.blurDataUrl}
                  className="mt-4 aspect-[4/3] w-full rounded-card"
                  imageClassName="transition-transform duration-500 group-hover:scale-[1.04]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />

                <span className="mt-4 grid size-9 place-items-center self-start rounded-card border border-line text-accent transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-white">
                  <ArrowRight className="size-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
