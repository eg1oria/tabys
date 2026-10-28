import { Container } from "@/components/ui/container";
import { Blueprint, Factory, Gear, Modules } from "@/components/ui/icons";
import { advantages } from "@/lib/content/services";

const icons = [Factory, Blueprint, Modules, Gear];

export function FeatureStrip() {
  return (
    <section className="border-b border-line bg-white">
      <Container className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {advantages.map((item, i) => {
          const Icon = icons[i];
          return (
            <div
              key={item.title}
              className="flex items-start gap-4 border-b border-line px-1 py-7 last:border-b-0 sm:px-6 lg:border-b-0 lg:border-r lg:last:border-r-0"
            >
              <Icon className="mt-0.5 size-7 shrink-0 text-accent" />
              <div>
                <p className="font-display text-[13px] font-bold uppercase leading-snug tracking-[0.02em]">
                  {item.title}
                </p>
                <p className="mt-1.5 text-[13px] leading-snug text-text-2">{item.description}</p>
              </div>
            </div>
          );
        })}
      </Container>
    </section>
  );
}
