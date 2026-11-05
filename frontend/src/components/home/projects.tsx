import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { ImageSlot } from "@/components/ui/image-slot";
import { ArrowRight } from "@/components/ui/icons";
import { getProjects } from "@/lib/api/public";

/** Первые три проекта из админки; нет ни одного — блока нет. */
export async function Projects() {
  const projects = (await getProjects()).slice(0, 3);
  if (projects.length === 0) return null;

  return (
    <section className="bg-muted py-16 lg:py-24">
      <Container>
        <SectionHeader
          number="05"
          label="Проекты"
          title={
            <>
              Реализованные
              <br />
              проекты
            </>
          }
          description="Оборудование, которое уже работает на предприятиях наших клиентов."
          action={
            <Link
              href="/proekty"
              className="group inline-flex items-center gap-2 text-[13px] font-medium text-accent"
            >
              Все проекты
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          }
        />

        <ul className="grid gap-4 md:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href="/proekty"
                className="group relative block aspect-[4/3] overflow-hidden rounded-card"
              >
                <ImageSlot
                  src={project.image?.url}
                  alt={project.image?.alt || project.title}
                  blurDataUrl={project.image?.blurDataUrl}
                  label={project.title}
                  className="absolute inset-0"
                  imageClassName="transition-transform duration-500 group-hover:scale-[1.05]"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/35 to-transparent"
                />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <h3 className="font-display text-[15px] font-bold uppercase leading-[1.3] tracking-[0.01em] text-white">
                    {project.title}
                  </h3>
                  {project.subtitle ? (
                    <p className="mt-2 text-[12px] text-white/65">{project.subtitle}</p>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
