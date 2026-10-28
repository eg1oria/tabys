import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { Check } from "@/components/ui/icons";
import { CtaBand } from "@/components/home/cta-band";
import { services } from "@/lib/content/services";

export const metadata: Metadata = {
  title: "Услуги",
  description:
    "Проектирование, изготовление оборудования по техническому заданию, комплектация производственных линий, монтаж, пусконаладка и сервисное обслуживание.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        breadcrumb="Услуги"
        title="Услуги"
        titleAccent="полного цикла"
        description="От анализа технологической задачи до запуска оборудования на вашей площадке и дальнейшего обслуживания."
      />

      <section className="bg-white py-14 lg:py-20">
        <Container>
          <SectionLabel number="01">Services</SectionLabel>
          <h2 className="display-title mt-4 max-w-xl text-[clamp(1.5rem,4.5vw,2.25rem)] leading-[1.08]">
            Что мы делаем
          </h2>

          <ul className="mt-10">
            {services.map((service) => (
              <li
                key={service.number}
                className="grid gap-5 border-t border-line py-8 last:border-b lg:grid-cols-12 lg:gap-8"
              >
                <p className="font-display text-[13px] font-bold text-accent lg:col-span-1">
                  {service.number}
                </p>
                <h3 className="font-display text-[17px] font-bold uppercase leading-snug tracking-[0.01em] lg:col-span-4">
                  {service.title}
                </h3>
                <p className="text-[14px] leading-relaxed text-text-2 lg:col-span-4">
                  {service.description}
                </p>
                <ul className="space-y-2 lg:col-span-3">
                  {service.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-[13px]">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-accent" />
                      {point}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
