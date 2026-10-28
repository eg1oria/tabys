import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import { ImageSlot } from "@/components/ui/image-slot";
import { lineStages, lineTypes } from "@/lib/content/lines";

export function Lines() {
  return (
    <section className="bg-white py-16 lg:py-24">
      <Container>
        <SectionHeader
          number="04"
          label="Производственные линии"
          title={
            <>
              Комплектуем
              <br />
              производственные линии
            </>
          }
          description="От отдельных единиц оборудования до комплексного оснащения производства под ключ."
          action={
            <Button href="/proizvodstvennye-linii" variant="dark" arrow>
              Обсудить линию
            </Button>
          }
        />

        <div className="grid gap-4 lg:grid-cols-12">
          <div className="relative overflow-hidden rounded-card lg:col-span-9">
            <ImageSlot
              src="/images/hero-main.jpg"
              alt="Производственная линия переработки молока"
              label="Производственная линия"
              className="aspect-[16/9] w-full lg:aspect-[16/7]"
              sizes="(max-width: 1024px) 100vw, 75vw"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/30 to-transparent"
            />
            <ul className="absolute bottom-0 left-0 p-6 lg:p-8">
              {lineStages.map((stage) => (
                <li
                  key={stage}
                  className="font-display text-[12px] font-bold uppercase leading-[1.9] tracking-[0.12em] text-white/85"
                >
                  {stage}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-card bg-muted p-6 lg:col-span-3">
            <p className="section-label">Линии для</p>
            <ul className="mt-5 space-y-3">
              {lineTypes.map((line) => (
                <li
                  key={line.title}
                  className="border-b border-line pb-3 text-[14px] last:border-b-0 last:pb-0"
                >
                  {line.title.replace("Линии для ", "")}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
