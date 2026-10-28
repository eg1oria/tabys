import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { ArrowRight, Drop } from "@/components/ui/icons";
import { solutions } from "@/lib/content/solutions";

export function Solutions() {
  return (
    <section className="bg-muted py-16 lg:py-24">
      <Container>
        <SectionHeader
          number="03"
          label="Решения"
          title={
            <>
              Решения для
              <br />
              пищевых производств
            </>
          }
          description="Подбираем и комплектуем оборудование под конкретный технологический процесс."
          action={
            <Link
              href="/proizvodstvennye-linii"
              className="group inline-flex items-center gap-2 text-[13px] font-medium text-accent"
            >
              Все решения
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          }
        />

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {solutions.map((solution, i) => (
            <li key={solution.slug}>
              <Link
                href="/proizvodstvennye-linii"
                className="group flex h-full flex-col justify-between rounded-card border border-line bg-white p-5 transition-colors hover:border-accent"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <Drop className="size-7 text-accent" />
                    <span className="text-[11px] font-semibold text-text-2">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-7 font-display text-[13px] font-bold uppercase leading-[1.35] tracking-[0.02em]">
                    {solution.title}
                  </h3>
                  <p className="mt-2.5 text-[12.5px] leading-snug text-text-2">
                    {solution.description}
                  </p>
                </div>
                <span className="mt-6 grid size-9 place-items-center rounded-card border border-line text-accent transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-white">
                  <ArrowRight className="size-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
