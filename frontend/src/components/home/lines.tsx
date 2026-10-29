import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { ImageSlot } from "@/components/ui/image-slot";
import { ArrowRight } from "@/components/ui/icons";
import { lineStages, lineTypes } from "@/lib/content/lines";

export function Lines() {
  return (
    <section className="bg-white py-16 lg:py-24">
      <Container>
        <div className="mb-8 lg:mb-10">
          <SectionLabel number="04" rule>
            Производственные линии
          </SectionLabel>
          <div className="mt-7 gap-10 lg:flex lg:items-start lg:justify-between">
            <h2 className="display-title max-w-2xl text-[clamp(1.75rem,5vw,3.25rem)] leading-[1.04]">
              Комплектуем
              <br />
              производственные линии
              <span
                aria-hidden
                className="ml-5 hidden h-[6px] w-[72px] align-middle bg-accent lg:inline-block"
              />
            </h2>
            <div className="mt-6 flex shrink-0 flex-col items-start gap-5 lg:mt-0 lg:max-w-xs">
              <p className="text-[14px] leading-relaxed text-text-2">
                От отдельных единиц оборудования до комплексного оснащения производства
                под ключ.
              </p>
              <Button href="/proizvodstvennye-linii" size="lg" arrow>
                Обсудить линию
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          <div className="relative overflow-hidden rounded-card lg:col-span-8 xl:col-span-9">
            <ImageSlot
              src="/images/hero-main.jpg"
              alt="Производственная линия переработки молока"
              label="Производственная линия"
              className="aspect-[4/3] w-full sm:aspect-[16/9] lg:aspect-[2/1]"
              sizes="(max-width: 1024px) 100vw, 70vw"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8">
              <p className="section-label flex items-center gap-2.5 text-white/70">
                <span aria-hidden className="size-2 rounded-full bg-accent" />
                Производство / KZ
              </p>
              <ul className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3 sm:flex">
                {lineStages.map((stage) => (
                  <li
                    key={stage}
                    className="font-display text-[11px] font-bold uppercase leading-[1.5] tracking-[0.1em] text-white sm:min-w-0 sm:flex-1 sm:border-l sm:border-white/25 sm:pl-5 sm:first:border-l-0 sm:first:pl-0"
                  >
                    {stage}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col rounded-card border border-line p-6 lg:col-span-4 xl:col-span-3">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-text-2">
              линии для
            </p>
            <ul className="mt-4 flex flex-1 flex-col justify-between">
              {lineTypes.map((line, i) => (
                <li key={line.title} className="border-b border-line last:border-b-0">
                  <Link
                    href="/proizvodstvennye-linii"
                    className="group flex items-center gap-4 py-3.5 lg:py-4"
                    title={line.description}
                  >
                    <span className="text-[11px] font-semibold text-accent">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 font-display text-[15px] font-bold capitalize">
                      {line.title.replace("Линии для ", "")}
                    </span>
                    <ArrowRight className="size-4 text-accent transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
