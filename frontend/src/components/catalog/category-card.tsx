import Link from "next/link";
import { ImageSlot } from "@/components/ui/image-slot";
import { ArrowRight } from "@/components/ui/icons";
import type { PublicCategory } from "@/lib/api/types";
import { categoryHref } from "@/lib/catalog-urls";

function plural(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "товар";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "товара";
  return "товаров";
}

export function CategoryCard({ category }: { category: PublicCategory }) {
  return (
    <Link
      href={categoryHref(category.slug)}
      className="group flex h-full flex-col rounded-card border border-line bg-white p-5 text-left transition-colors hover:border-accent"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-h-[2.7em] font-display text-[13px] font-bold uppercase leading-[1.35] tracking-[0.02em]">
          {category.title}
        </h3>
        <span className="shrink-0 rounded-card bg-muted px-2 py-1 text-[11px] text-text-2">
          {category.count} {plural(category.count)}
        </span>
      </div>

      <ImageSlot
        src={category.image?.url}
        alt={category.image?.alt || category.title}
        label={category.title}
        blurDataUrl={category.image?.blurDataUrl}
        className="mt-4 aspect-[4/3] w-full rounded-card"
        imageClassName="transition-transform duration-500 group-hover:scale-[1.04]"
        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
      />

      <p className="mt-4 flex-1 text-[12.5px] leading-snug text-text-2">
        {category.description}
      </p>

      <span className="mt-4 grid size-9 shrink-0 place-items-center self-end rounded-card border border-line text-accent transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-white">
        <ArrowRight className="size-4" />
      </span>
    </Link>
  );
}
