import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { ImageSlot } from "@/components/ui/image-slot";
import { CtaBand } from "@/components/home/cta-band";
import { Solutions } from "@/components/home/solutions";
import { lineStages, lineTypes } from "@/lib/content/lines";

export const metadata: Metadata = {
  title: "Производственные линии",
  description:
    "Комплектуем производственные линии для молока, сыра, сметаны, йогурта, творога и кефира — от приёмки сырья до фасовки готового продукта.",
};

export default function LinesPage() {
  return (
    <>
      <PageHero
        breadcrumb="Производственные линии"
        title="Производственные"
        titleAccent="линии под ключ"
        description="Комплексное оснащение производства: подбираем, изготавливаем и связываем оборудование в единую технологическую линию."
      />

      <section className="bg-white py-14 lg:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <SectionLabel number="01">Lines</SectionLabel>
              <h2 className="display-title mt-4 text-[clamp(1.5rem,4.5vw,2.25rem)] leading-[1.08]">
                Этапы
                <br />
                технологической линии
              </h2>
              <p className="mt-6 text-[14px] leading-relaxed text-text-2">
                Линия собирается под конкретный продукт и объём производства. Каждый
                этап рассчитывается так, чтобы оборудование работало без узких мест.
              </p>
              <ol className="mt-8">
                {lineStages.map((stage, i) => (
                  <li
                    key={stage}
                    className="flex items-baseline gap-5 border-b border-line py-4 first:pt-0 last:border-b-0"
                  >
                    <span className="font-display text-[13px] font-bold text-accent">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[14px]">{stage}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="lg:col-span-7">
              <ImageSlot
                src="/images/hero-main.jpg"
                alt="Производственная линия из нержавеющей стали"
                className="aspect-[4/3] w-full rounded-card"
                sizes="(max-width: 1024px) 100vw, 58vw"
              />
            </div>
          </div>

          <div className="mt-14">
            <SectionLabel number="02">Types</SectionLabel>
            <h2 className="display-title mt-4 text-[clamp(1.5rem,4.5vw,2.25rem)] leading-[1.08]">
              Линии для разных продуктов
            </h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lineTypes.map((line) => (
                <li
                  key={line.title}
                  className="rounded-card border border-line p-6 transition-colors hover:border-accent"
                >
                  <h3 className="font-display text-[14px] font-bold uppercase tracking-[0.02em]">
                    {line.title}
                  </h3>
                  <p className="mt-3 text-[13px] leading-snug text-text-2">
                    {line.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <Solutions />
      <CtaBand />
    </>
  );
}
