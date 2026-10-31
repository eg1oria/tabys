import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/ui/page-hero";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { ImageSlot } from "@/components/ui/image-slot";
import { Check } from "@/components/ui/icons";
import { CtaBand } from "@/components/home/cta-band";
import { projects } from "@/lib/content/projects";

export const metadata: Metadata = pageMetadata({
  title: "Проекты",
  description:
    "Реализованные проекты Tabys Consulting: комплексы переработки молока, сыроварни под ключ, линии пастеризации и розлива в Казахстане.",
  path: "/proekty",
});

export default function ProjectsPage() {
  return (
    <>
      <PageHero
        breadcrumb="Проекты"
        title="Реализованные"
        titleAccent="проекты"
        description="Оборудование, которое уже работает на предприятиях наших клиентов по всему Казахстану."
      />

      <section className="bg-white py-14 lg:py-20">
        <Container>
          <SectionLabel number="01">Projects</SectionLabel>
          <h2 className="display-title mt-4 max-w-xl text-[clamp(1.5rem,4.5vw,2.25rem)] leading-[1.08]">
            Наши работы
          </h2>

          <ul className="mt-10 space-y-5">
            {projects.map((project, i) => (
              <li
                key={project.slug}
                className="grid gap-6 rounded-card border border-line p-5 lg:grid-cols-12 lg:gap-8 lg:p-6"
              >
                <ImageSlot
                  src={project.image}
                  alt={project.title}
                  className="aspect-[4/3] w-full rounded-card lg:col-span-5"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />

                <div className="lg:col-span-7">
                  <p className="section-label">
                    {String(i + 1).padStart(2, "0")} / {project.location} · {project.year}
                  </p>
                  <h3 className="display-title mt-4 text-[1.25rem] leading-tight sm:text-[1.5rem]">
                    {project.title}
                  </h3>
                  <p className="mt-3 text-[14px] text-text-2">{project.subtitle}</p>

                  <ul className="mt-6 space-y-2.5 border-t border-line pt-5">
                    {project.scope.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-[13.5px]">
                        <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
