import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ImageSlot } from "@/components/ui/image-slot";
import { Pin } from "@/components/ui/icons";
import { company } from "@/lib/content/company";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-ink text-white">
      <ImageSlot
        src="/images/hero-main.jpg"
        alt="Производственный цех с ёмкостями из нержавеющей стали"
        className="absolute inset-0 -z-10"
        imageClassName="opacity-55"
        sizes="100vw"
        priority
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/90 to-ink/30"
      />

      <Container className="relative py-16 sm:py-24 lg:py-28">
        <div className="lg:flex lg:items-start lg:justify-between lg:gap-12">
          <div className="max-w-2xl">
            <p className="section-label text-white/50">
              Надёжное оборудование / для развития вашего производства
            </p>

            <h1 className="display-title mt-6 text-[clamp(1.75rem,7vw,4.25rem)] leading-[1.02]">
              Оборудование
              <br />
              для <span className="text-accent">пищевых</span>
              <br />
              производств
            </h1>

            <p className="mt-7 max-w-lg text-[15px] leading-relaxed text-white/70">
              От отдельных единиц оборудования до комплексных производственных линий.
              Проектируем, производим и комплектуем оборудование из нержавеющей стали
              под задачи вашего производства.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button href="/kontakty" size="lg" arrow>
                Обсудить проект
              </Button>
              <Button href="/oborudovanie" size="lg" variant="outlineLight">
                Смотреть оборудование
              </Button>
            </div>

            <p className="mt-10 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
              <Pin className="size-4 text-accent" />
              {company.city}
            </p>
          </div>

          {/* Технический бейдж, как в макете */}
          <div className="mt-12 hidden w-[232px] shrink-0 border border-white/20 p-6 xl:block">
            <p className="font-display text-[13px] font-bold uppercase leading-[1.7] tracking-[0.12em] text-white/75">
              Нержавеющая
              <br />
              сталь
            </p>
            <p className="mt-4 border-t border-white/15 pt-4 font-display text-[13px] font-bold uppercase leading-[1.7] tracking-[0.12em] text-white/75">
              Пищевое
              <br />
              оборудование
            </p>
            <p className="mt-4 border-t border-white/15 pt-4 font-display text-[13px] font-bold uppercase tracking-[0.12em] text-accent">
              Сделано в KZ
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
