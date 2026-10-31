import Link from "next/link";
import { Suspense } from "react";
import { getCategories } from "@/lib/api/public";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { ImageSlot } from "@/components/ui/image-slot";
import { ArrowRight } from "@/components/ui/icons";

const SLUG = "torcevye-uplotneniya";

/**
 * Фото и число позиций — из категории каталога, а не из вёрстки: обложку
 * редактор меняет в админке, и главная обновляется вместе с каталогом.
 * Пока обложки нет — плейсхолдер.
 */
async function SealsCatalog() {
  // Список, а не getCategory: при лежащем бэкенде он пуст, а не бросает —
  // блок не должен ронять главную. Тот же запрос делает EquipmentGrid,
  // так что лишнего похода в API нет.
  const category = (await getCategories()).find((item) => item.slug === SLUG);
  return <SealsMedia image={category?.image ?? null} count={category?.count} />;
}

function SealsMedia({
  image,
  count,
}: {
  image: { url: string; alt: string; blurDataUrl: string | null } | null;
  count?: number;
}) {
  return (
    <>
      <ImageSlot
        src={image?.url}
        alt={image?.alt || "Торцевые уплотнения для насосов"}
        label="Торцевые уплотнения"
        blurDataUrl={image?.blurDataUrl}
        className="aspect-[3/2] rounded-card lg:col-span-5 lg:aspect-auto"
        sizes="(max-width: 1024px) 100vw, 42vw"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-1">
        <div className="flex flex-col justify-center rounded-card bg-muted p-5">
          <p className="font-display text-[13px] font-bold uppercase leading-[1.5] tracking-[0.08em]">
            Надёжные
            <br />
            решения
          </p>
          <p className="mt-2 text-[12.5px] text-text-2">для вашего оборудования</p>
        </div>
        <div className="flex flex-col justify-center rounded-card bg-ink p-5 text-white">
          <p className="font-display text-[13px] font-bold uppercase leading-[1.5] tracking-[0.08em]">
            {count ? `${count} ${positions(count)}` : "Подбор по образцу"}
          </p>
          <p className="mt-2 text-[12.5px] text-white/60">в наличии и под заказ</p>
        </div>
      </div>
    </>
  );
}

function positions(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "позиция";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "позиции";
  return "позиций";
}

export function Seals() {
  return (
    <section className="bg-white py-16 lg:py-24">
      <Container>
        <div className="grid items-stretch gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col justify-center lg:col-span-4">
            <SectionLabel number="06">Комплектующие</SectionLabel>
            <h2 className="display-title mt-5 text-[clamp(1.5rem,4.5vw,2.5rem)] leading-[1.08]">
              Торцевые
              <br />
              уплотнения
            </h2>
            <p className="mt-6 max-w-md text-[14px] leading-relaxed text-text-2">
              Подбор и поставка торцевых уплотнений для насосов и промышленного
              оборудования, в том числе Grundfos и других серий.
            </p>
            <Link
              href="/oborudovanie/torcevye-uplotneniya"
              className="group mt-7 inline-flex items-center gap-2 text-[13px] font-medium text-accent"
            >
              Перейти в каталог
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Без бэкенда на сборке — плейсхолдер, дорисуется по запросу. */}
          <Suspense fallback={<SealsMedia image={null} />}>
            <SealsCatalog />
          </Suspense>
        </div>
      </Container>
    </section>
  );
}
