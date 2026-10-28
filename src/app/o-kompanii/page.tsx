import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { ImageSlot } from "@/components/ui/image-slot";
import { CtaBand } from "@/components/home/cta-band";
import { WhyUs } from "@/components/home/why-us";
import { companyFacts } from "@/lib/content/lines";

export const metadata: Metadata = {
  title: "О компании",
  description:
    "Tabys Consulting — собственное производство оборудования из нержавеющей стали для пищевой промышленности в Алматы. Проектирование, изготовление по ТЗ, комплектация линий и сервис.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        breadcrumb="О компании"
        title="О компании"
        titleAccent="Tabys Consulting"
        description="Производим оборудование для пищевых производств в Казахстане — от отдельных ёмкостей до комплексных линий под ключ."
      />

      <section className="bg-white py-14 lg:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-6">
              <SectionLabel number="01">About</SectionLabel>
              <h2 className="display-title mt-4 text-[clamp(1.5rem,4.5vw,2.25rem)] leading-[1.08]">
                Собственное производство
                <br />в Алматы
              </h2>
              <div className="mt-6 space-y-4 text-[14.5px] leading-relaxed text-text-2">
                <p>
                  Tabys Consulting проектирует и производит оборудование из нержавеющей
                  стали для переработки молока, производства сыра, творога, кисломолочных
                  продуктов и напитков.
                </p>
                <p>
                  Мы работаем полным циклом: анализируем технологическую задачу,
                  разрабатываем конструкцию, изготавливаем оборудование на собственном
                  производстве, комплектуем линию, доставляем и запускаем её на площадке
                  заказчика.
                </p>
                <p>
                  Заказчики — предприятия пищевой промышленности по всему Казахстану: от
                  небольших фермерских цехов до крупных молочных производств.
                </p>
              </div>
            </div>

            <div className="lg:col-span-6">
              <ImageSlot
                src="/images/welding.jpg"
                alt="Производство оборудования Tabys Consulting"
                className="aspect-[4/3] w-full rounded-card"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>

          <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {companyFacts.map((fact) => (
              <li key={fact.label} className="rounded-card bg-muted p-6">
                <p className="display-title text-[1.75rem] text-accent">{fact.value}</p>
                <p className="mt-3 text-[13px] leading-snug text-text-2">{fact.label}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <WhyUs />
      <CtaBand />
    </>
  );
}
