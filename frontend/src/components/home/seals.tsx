import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { ImageSlot } from "@/components/ui/image-slot";
import { ArrowRight } from "@/components/ui/icons";

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

          <ImageSlot
            src="/images/seals.jpg"
            alt="Торцевые уплотнения для насосов"
            label="Торцевые уплотнения"
            className="aspect-[3/2] rounded-card lg:col-span-5"
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
                20 позиций
              </p>
              <p className="mt-2 text-[12.5px] text-white/60">в наличии и под заказ</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
