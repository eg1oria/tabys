import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { ImageSlot } from "@/components/ui/image-slot";
import { tzSteps } from "@/lib/content/services";

export function TzBlock() {
  return (
    <section className="bg-white py-16 lg:py-24">
      <Container>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <SectionLabel number="02">Изготовление по ТЗ</SectionLabel>
            <h2 className="display-title mt-5 text-[clamp(1.5rem,4.5vw,2.5rem)] leading-[1.08]">
              Производство
              <br />
              по вашему ТЗ
            </h2>
            <p className="mt-6 text-[14px] leading-relaxed text-text-2">
              Не нашли готовое решение? Изготовим оборудование по вашему техническому
              заданию с учётом всех технологических требований.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/kontakty" arrow>
                Отправить ТЗ
              </Button>
              <Button href="/uslugi" variant="outline">
                Консультация
              </Button>
            </div>
          </div>

          <ImageSlot
            src="/images/welding.jpg"
            alt="Сварка ёмкости из нержавеющей стали"
            label="Производство"
            className="aspect-[4/3] rounded-card lg:col-span-4 lg:aspect-auto"
            sizes="(max-width: 1024px) 100vw, 33vw"
          />

          <ol className="lg:col-span-4">
            {tzSteps.map((step) => (
              <li
                key={step.number}
                className="flex items-baseline gap-5 border-b border-line py-4 first:pt-0 last:border-b-0"
              >
                <span className="font-display text-[13px] font-bold text-accent">
                  {step.number}
                </span>
                <span className="text-[14px] leading-snug">{step.title}</span>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
