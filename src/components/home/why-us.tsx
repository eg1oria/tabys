import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { Blueprint, Factory, Gear, Modules, Shield } from "@/components/ui/icons";
import { whyUs } from "@/lib/content/services";

const icons = [Factory, Blueprint, Modules, Shield, Gear];

export function WhyUs() {
  return (
    <section className="bg-muted py-16 lg:py-24">
      <Container>
        <SectionLabel number="07">Преимущества</SectionLabel>
        <h2 className="display-title mt-5 text-[clamp(1.5rem,4.5vw,2.5rem)] leading-[1.08]">
          Почему
          <br />
          Tabys Consulting
        </h2>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {whyUs.map((item, i) => {
            const Icon = icons[i];
            return (
              <li
                key={item.title}
                className="rounded-card border border-line bg-white p-5 transition-colors hover:border-accent"
              >
                <Icon className="size-7 text-accent" />
                <p className="mt-6 font-display text-[13px] font-bold uppercase leading-[1.35] tracking-[0.02em]">
                  {item.title}
                </p>
                <p className="mt-2.5 text-[12.5px] leading-snug text-text-2">
                  {item.description}
                </p>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
