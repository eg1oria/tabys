import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { Phone } from "@/components/ui/icons";
import { ProductCard, priceLabel } from "@/components/catalog/product-card";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { RequestForm } from "@/components/forms/request-form";
import { JsonLd, breadcrumbList } from "@/components/seo/json-ld";
import { buildTimeProductSlugs, getCategoryProducts, getProduct } from "@/lib/api/public";
import type { PublicProductDetail } from "@/lib/api/types";
import { BUILD_PLACEHOLDER, categoryHref, productHref } from "@/lib/catalog-urls";
import { SITE_URL, company, primaryPhone } from "@/lib/content/company";

type Props = PageProps<"/oborudovanie/[category]/[product]">;

/** Description для поиска: своё описание товара или собранное из полей. */
function describe(product: PublicProductDetail): string {
  const own = product.description?.replace(/\s+/g, " ").trim();
  if (own) return own.length > 160 ? `${own.slice(0, 157).trimEnd()}…` : own;
  return `${product.title} — ${product.category.title.toLowerCase()} от ${company.shortName}. ${priceLabel(product)}. Подбор и расчёт под вашу задачу.`;
}

/**
 * Страница товара — /oborudovanie/<категория>/<товар>. Устроена как
 * страница категории (см. там, почему данные читаются вне Suspense):
 * несуществующий товар отвечает настоящим 404.
 */
/**
 * Блокирующий маршрут — сознательно: ответ ждёт данных, зато статус
 * честный (404 на несуществующий адрес). Данные из кеша, так что ждать
 * почти нечего; переход с карточки всё равно предзагружается ссылкой.
 */
export const instant = false;

export async function generateStaticParams({ params }: { params: { category: string } }) {
  const slugs =
    params.category === BUILD_PLACEHOLDER ? [] : await buildTimeProductSlugs(params.category);
  return (slugs.length > 0 ? slugs : [BUILD_PLACEHOLDER]).map((product) => ({ product }));
}

function isPlaceholder(category: string, product: string): boolean {
  return category === BUILD_PLACEHOLDER || product === BUILD_PLACEHOLDER;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, product: slug } = await params;
  const product = isPlaceholder(category, slug) ? null : await getProduct(category, slug);
  if (!product) return {};

  const url = productHref(product.category.slug, product.slug);
  const image = product.images[0];
  return {
    title: `${product.title} — ${product.category.title}`,
    description: describe(product),
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: product.title,
      description: describe(product),
      url,
      images: image
        ? [
            {
              url: image.url,
              width: image.width ?? undefined,
              height: image.height ?? undefined,
              alt: image.alt || product.title,
            },
          ]
        : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { category: categorySlug, product: slug } = await params;
  if (isPlaceholder(categorySlug, slug)) notFound();

  const [product, siblings] = await Promise.all([
    getProduct(categorySlug, slug),
    getCategoryProducts(categorySlug),
  ]);
  if (!product) notFound();

  const url = productHref(product.category.slug, product.slug);
  const specs = product.specs;
  const others = siblings.filter((p) => p.slug !== product.slug).slice(0, 3);
  const price = product.priceOnRequest || !product.priceFrom ? null : product.priceFrom;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.title,
          description: describe(product),
          url: `${SITE_URL}${url}`,
          category: product.category.title,
          ...(product.sku ? { sku: product.sku } : {}),
          ...(product.images.length > 0 ? { image: product.images.map((i) => i.url) } : {}),
          brand: { "@type": "Brand", name: company.shortName },
          // Цену указываем, только если она задана: «по запросу» — не 0 ₸.
          ...(price
            ? { offers: { "@type": "Offer", price, priceCurrency: "KZT", url: `${SITE_URL}${url}` } }
            : {}),
        }}
      />
      <JsonLd
        data={breadcrumbList([
          { name: "Главная", path: "/" },
          { name: "Оборудование", path: "/oborudovanie" },
          { name: product.category.title, path: categoryHref(product.category.slug) },
          { name: product.title, path: url },
        ])}
      />

      <section className="bg-white pb-14 pt-8 lg:pb-20 lg:pt-10">
        <Container>
          <nav aria-label="Хлебные крошки" className="text-xs text-text-2">
            <Link href="/" className="transition-colors hover:text-ink">
              Главная
            </Link>
            <span className="px-2 text-text-2/50">/</span>
            <Link href="/oborudovanie" className="transition-colors hover:text-ink">
              Оборудование
            </Link>
            <span className="px-2 text-text-2/50">/</span>
            <Link
              href={categoryHref(product.category.slug)}
              className="transition-colors hover:text-ink"
            >
              {product.category.title}
            </Link>
            <span className="px-2 text-text-2/50">/</span>
            <span aria-current="page" className="text-ink">
              {product.title}
            </span>
          </nav>

          <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-12">
            <ProductGallery images={product.images} title={product.title} />

            <div>
              <SectionLabel>
                <Link href={categoryHref(product.category.slug)} className="hover:underline">
                  {product.category.title}
                </Link>
              </SectionLabel>
              <h1 className="display-title mt-4 text-[clamp(1.5rem,4.5vw,2.5rem)] leading-[1.08]">
                {product.title}
              </h1>
              {product.sku ? (
                <p className="mt-3 text-[13px] text-text-2">Артикул: {product.sku}</p>
              ) : null}

              <p className="mt-6 font-display text-[1.25rem] font-bold text-accent">
                {priceLabel(product)}
              </p>

              {product.description ? (
                <p className="mt-6 whitespace-pre-line text-[14px] leading-relaxed text-text-2">
                  {product.description}
                </p>
              ) : (
                <p className="mt-6 text-[14px] leading-relaxed text-text-2">
                  Изготавливаем под задачу производства. Подберём исполнение, объём и
                  комплектацию — оставьте заявку, и инженер свяжется с вами.
                </p>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="#zayavka" arrow>
                  Запросить расчёт
                </Button>
                <Button href={primaryPhone.href} variant="outline">
                  <Phone className="size-4" />
                  {primaryPhone.display}
                </Button>
              </div>

              {specs.length > 0 ? (
                <div className="mt-10">
                  <h2 className="font-display text-[15px] font-bold uppercase tracking-[0.02em]">
                    Характеристики
                  </h2>
                  <dl className="mt-4 divide-y divide-line border-y border-line">
                    {specs.map(({ key, value }) => (
                      <div key={key} className="grid grid-cols-2 gap-4 py-3 text-[13.5px]">
                        <dt className="text-text-2">{key}</dt>
                        <dd className="font-medium">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}
            </div>
          </div>
        </Container>
      </section>

      <section id="zayavka" className="scroll-mt-24 bg-muted py-14 lg:py-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-5">
              <SectionLabel number="01">Request</SectionLabel>
              <h2 className="display-title mt-4 text-[clamp(1.5rem,4.5vw,2.25rem)] leading-[1.08]">
                Запросить расчёт
              </h2>
              <p className="mt-5 text-[14px] leading-relaxed text-text-2">
                Уточним параметры, подберём исполнение и пришлём коммерческое
                предложение. Можно приложить техническое задание.
              </p>
            </div>
            <div className="lg:col-span-7">
              <RequestForm
                defaultMessage={`Интересует: ${product.title}${product.sku ? ` (арт. ${product.sku})` : ""}.\n`}
              />
            </div>
          </div>
        </Container>
      </section>

      {others.length > 0 ? (
        <section className="bg-white py-14 lg:py-20">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="display-title text-[clamp(1.25rem,3.5vw,1.75rem)] leading-[1.1]">
                Ещё в категории
              </h2>
              <Link
                href={categoryHref(product.category.slug)}
                className="text-[13px] font-medium text-accent hover:underline"
              >
                Все позиции «{product.category.title}» →
              </Link>
            </div>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((other) => (
                <li key={other.slug}>
                  <ProductCard product={other} />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}
    </>
  );
}
