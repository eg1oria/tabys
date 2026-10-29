import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { ImageSlot } from "@/components/ui/image-slot";
import { ArrowRight, Blueprint, Gear, Modules, Shield } from "@/components/ui/icons";
import { whyUs } from "@/lib/content/services";

const [lead, ...rest] = whyUs;
const icons = [Blueprint, Modules, Shield, Gear];

export function WhyUs() {
  return (
    <section className="bg-muted py-16 lg:py-24">
      <Container>
        <SectionLabel number="07" rule>
          Преимущества
        </SectionLabel>
        <div className="mt-7 gap-10 lg:flex lg:items-start lg:justify-between">
          <h2 className="display-title max-w-2xl text-[clamp(1.75rem,5vw,3.25rem)] leading-[1.04]">
            Почему
            <br />
            Tabys Consulting
            <span
              aria-hidden
              className="ml-5 hidden h-[6px] w-[72px] align-middle bg-accent lg:inline-block"
            />
          </h2>
          <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-text-2 lg:mt-0 lg:text-right">
            Полный цикл реализации проектов в пищевой промышленности — от идеи
            до стабильной работы производства.
          </p>
        </div>

        <div className="mt-9 grid gap-4 lg:grid-cols-2">
          <article className="relative flex min-h-[440px] flex-col justify-between overflow-hidden rounded-card bg-ink p-7 lg:p-9">
            <ImageSlot
              src={lead.image}
              alt={lead.title}
              label={lead.title}
              className="absolute inset-0"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/25"
            />
            <div className="relative">
              <div className="flex items-center gap-5">
                <span className="text-[11px] font-semibold tracking-[0.14em] text-accent">
                  01
                </span>
                <span aria-hidden className="h-px w-40 bg-white/30" />
              </div>
              <h3 className="display-title mt-8 max-w-xs text-[clamp(1.25rem,2.4vw,1.75rem)] text-white">
                {lead.title}
              </h3>
              <p className="mt-4 max-w-[17rem] text-[14px] leading-relaxed text-white/70">
                {lead.description}.
              </p>
            </div>
            <Link
              href="/o-kompanii"
              className="group relative mt-10 inline-flex items-center gap-4 self-start"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-full border border-white/50 text-white transition-colors group-hover:bg-white group-hover:text-ink">
                <ArrowRight className="size-5" />
              </span>
              <span className="text-[13px] leading-snug text-white/85">
                Подробнее
                <br />
                о производстве
              </span>
            </Link>
          </article>

          <ul className="grid gap-4 sm:grid-cols-2">
            {rest.map((item, i) => {
              const Icon = icons[i];
              return (
                <li
                  key={item.title}
                  className="flex flex-col overflow-hidden rounded-card border border-line bg-white transition-colors hover:border-accent"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex flex-1 items-center gap-3">
                        <span className="text-[11px] font-semibold tracking-[0.14em] text-accent">
                          {String(i + 2).padStart(2, "0")}
                        </span>
                        <span aria-hidden className="h-px flex-1 bg-line" />
                      </span>
                      <Icon className="size-6 shrink-0 text-accent" />
                    </div>
                    <h3 className="mt-4 min-h-[2.7em] font-display text-[13px] font-bold uppercase leading-[1.35] tracking-[0.02em]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-[12.5px] leading-snug text-text-2">
                      {item.description}.
                    </p>
                  </div>
                  <ImageSlot
                    src={item.image}
                    alt={item.title}
                    label={item.title}
                    className="mt-auto aspect-[16/9] w-full"
                    sizes="(max-width: 640px) 100vw, 25vw"
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </Container>
    </section>
  );
}
