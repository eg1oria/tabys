import Link from "next/link";
import { ImageSlot } from "@/components/ui/image-slot";
import { ArrowRight } from "@/components/ui/icons";
import type { PublicProduct } from "@/lib/api/types";
import { productHref } from "@/lib/catalog-urls";

/**
 * Цена приходит строкой (Decimal), число потеряло бы точность.
 * Формулировка своя, витринная: в админке то же поле подписано «по запросу».
 */
export function priceLabel(product: PublicProduct): string {
  if (product.priceOnRequest || !product.priceFrom) return "Цена по запросу";
  const amount = Number(product.priceFrom);
  if (!Number.isFinite(amount)) return "Цена по запросу";
  return `от ${amount.toLocaleString("ru-RU")} ₸`;
}

/** Позиция каталога в сетке категории — ведёт на страницу товара. */
export function ProductCard({ product }: { product: PublicProduct }) {
  // Характеристик бывает много — в карточке показываем первые четыре.
  const specs = Object.entries(product.specs ?? {}).slice(0, 4);

  return (
    <Link
      href={productHref(product.category.slug, product.slug)}
      className="group flex h-full flex-col rounded-card border border-line bg-white p-5 transition-colors hover:border-accent"
    >
      <ImageSlot
        src={product.image?.url}
        alt={product.image?.alt || product.title}
        label={product.title}
        blurDataUrl={product.image?.blurDataUrl}
        className="aspect-[4/3] w-full rounded-card"
        imageClassName="transition-transform duration-500 group-hover:scale-[1.04]"
        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 30vw"
      />

      <h3 className="mt-4 font-display text-[13px] font-bold uppercase leading-[1.35] tracking-[0.02em]">
        {product.title}
      </h3>

      {product.description ? (
        <p className="mt-2.5 line-clamp-3 flex-1 text-[12.5px] leading-snug text-text-2">
          {product.description}
        </p>
      ) : (
        <div className="flex-1" />
      )}

      {specs.length > 0 ? (
        <dl className="mt-4 space-y-1.5 border-t border-line pt-3.5">
          {specs.map(([key, value]) => (
            <div key={key} className="flex items-baseline justify-between gap-3 text-[12.5px]">
              <dt className="text-text-2">{key}</dt>
              <dd className="text-right font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold text-accent">{priceLabel(product)}</p>
        <span className="grid size-9 shrink-0 place-items-center rounded-card border border-line text-accent transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-white">
          <ArrowRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}
