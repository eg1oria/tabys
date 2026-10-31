import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/ui/page-hero";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { Check } from "@/components/ui/icons";
import { CategoryChips, CategorySidebar } from "@/components/catalog/category-sidebar";
import { ProductCard } from "@/components/catalog/product-card";
import { CtaBand } from "@/components/home/cta-band";
import { JsonLd, breadcrumbList } from "@/components/seo/json-ld";
import {
  buildTimeCategorySlugs,
  getCategories,
  getCategory,
  getCategoryProducts,
} from "@/lib/api/public";
import { BUILD_PLACEHOLDER, categoryHref } from "@/lib/catalog-urls";

type Props = PageProps<"/oborudovanie/[category]">;

/**
 * Страница категории — /oborudovanie/<слаг>. Всё содержимое из админки:
 * название, описание, SEO-поля, фото и опубликованные товары.
 *
 * params и данные читаем вне Suspense, до начала ответа: иначе notFound()
 * срабатывает, когда заголовки уже ушли, и несуществующий адрес отвечает
 * 200 — для поисковика это «мягкая 404». Вне Suspense с cacheComponents
 * можно только при generateStaticParams. Категории, заведённые после
 * сборки, рендерятся по первому запросу и дальше живут в кеше.
 *
 * Оговорка про прод: с partialPrefetching самый первый запрос к адресу,
 * которого не было на сборке, получает общую оболочку сразу (200), а
 * notFound() доезжает потоком и добавляет noindex — индексировать такое
 * поисковик не станет. Со второго запроса адрес отвечает честным 404 из кеша.
 * Выключить это можно только глобально, вместе с partialPrefetching.
 */
/**
 * Блокирующий маршрут — сознательно: ответ ждёт данных, зато статус
 * честный (404 на несуществующий адрес). Данные из кеша, так что ждать
 * почти нечего; переход с карточки всё равно предзагружается ссылкой.
 */
export const instant = false;

export async function generateStaticParams() {
  const slugs = await buildTimeCategorySlugs();
  return (slugs.length > 0 ? slugs : [BUILD_PLACEHOLDER]).map((category) => ({ category }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  // Нет категории — метаданные даёт not-found, 404 отвечает сама страница.
  const category = slug === BUILD_PLACEHOLDER ? null : await getCategory(slug);
  if (!category) return {};

  const title = category.seoTitle || category.title;
  const description = category.seoDescription || category.description;
  return {
    title,
    description,
    alternates: { canonical: categoryHref(category.slug) },
    openGraph: {
      type: "website",
      title,
      description,
      url: categoryHref(category.slug),
      images: category.image
        ? [
            {
              url: category.image.url,
              width: category.image.width ?? undefined,
              height: category.image.height ?? undefined,
              alt: category.image.alt || category.title,
            },
          ]
        : undefined,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category: slug } = await params;
  if (slug === BUILD_PLACEHOLDER) notFound();

  const [category, products, categories] = await Promise.all([
    getCategory(slug),
    getCategoryProducts(slug),
    getCategories(),
  ]);
  if (!category) notFound();

  return (
    <>
      <JsonLd
        data={breadcrumbList([
          { name: "Главная", path: "/" },
          { name: "Оборудование", path: "/oborudovanie" },
          { name: category.title, path: categoryHref(category.slug) },
        ])}
      />

      <PageHero
        trail={[{ label: "Оборудование", href: "/oborudovanie" }]}
        breadcrumb={category.title}
        title={category.title}
        description={category.description}
        image={category.image?.url}
        imageBlur={category.image?.blurDataUrl}
      />

      <section className="bg-white py-12 lg:py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
            <aside className="min-w-0 lg:col-span-3">
              <CategoryChips categories={categories} active={category.slug} />
              <div className="hidden lg:block">
                <CategorySidebar categories={categories} active={category.slug} />
              </div>
            </aside>

            <div className="min-w-0 lg:col-span-9">
              <SectionLabel number="01">{category.count} позиций в категории</SectionLabel>
              <h2 className="display-title mt-4 text-[clamp(1.5rem,4.5vw,2.25rem)] leading-[1.08]">
                Позиции категории
              </h2>

              {category.highlights.length > 0 ? (
                <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  {category.highlights.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-[13.5px]">
                      <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                      {point}
                    </li>
                  ))}
                </ul>
              ) : null}

              {products.length > 0 ? (
                <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {products.map((product) => (
                    <li key={product.slug}>
                      <ProductCard product={product} />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-8 rounded-card border border-line bg-muted p-10 text-center">
                  <p className="font-display text-[15px] font-bold uppercase">
                    Позиции уточняются
                  </p>
                  <p className="mx-auto mt-3 max-w-sm text-[13px] text-text-2">
                    Расскажите о задаче — подберём оборудование этой категории или
                    изготовим по вашему техническому заданию.
                  </p>
                </div>
              )}

              <div className="mt-10 flex flex-wrap gap-3">
                <Button href="/kontakty" arrow>
                  Запросить подбор
                </Button>
                <Button href="/kontakty" variant="outline">
                  Отправить ТЗ
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
