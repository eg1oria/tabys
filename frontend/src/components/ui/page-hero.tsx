import Link from "next/link";
import { Container } from "./container";
import { ImageSlot } from "./image-slot";
import { company } from "@/lib/content/company";
import { Pin } from "./icons";

type Crumb = { label: string; href: string };

type Props = {
  /** Текущая страница — последняя, некликабельная крошка. */
  breadcrumb: string;
  /** Крошки между «Главной» и текущей страницей. */
  trail?: Crumb[];
  title: string;
  /** Вторая строка заголовка — подсвечивается акцентом. */
  titleAccent?: string;
  description: string;
  /** Путь в /public или адрес из медиатеки. */
  image?: string;
  imageBlur?: string | null;
};

export function PageHero({
  breadcrumb,
  trail = [],
  title,
  titleAccent,
  description,
  image = "/images/hero-dark.jpg",
  imageBlur,
}: Props) {
  return (
    <section className="relative isolate overflow-hidden bg-ink text-white">
      <ImageSlot
        src={image}
        alt=""
        blurDataUrl={imageBlur}
        className="absolute inset-0 -z-10"
        imageClassName="opacity-45"
        sizes="100vw"
        priority
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/85 to-ink/35"
      />

      <Container className="relative py-14 sm:py-20 lg:py-24">
        <nav aria-label="Хлебные крошки" className="mb-8 text-xs text-white/55">
          <Link href="/" className="transition-colors hover:text-white">
            Главная
          </Link>
          {trail.map((crumb) => (
            <span key={crumb.href}>
              <span className="px-2 text-white/30">/</span>
              <Link href={crumb.href} className="transition-colors hover:text-white">
                {crumb.label}
              </Link>
            </span>
          ))}
          <span className="px-2 text-white/30">/</span>
          <span aria-current="page" className="text-white/90">
            {breadcrumb}
          </span>
        </nav>

        <h1 className="display-title max-w-4xl text-[clamp(1.625rem,6.5vw,4rem)] leading-[1.03]">
          {title}
          {titleAccent ? (
            <>
              <br />
              <span className="text-accent">{titleAccent}</span>
            </>
          ) : null}
        </h1>

        <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-white/70">{description}</p>

        <p className="mt-8 inline-flex items-center gap-2 border-t border-white/15 pt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
          <Pin className="size-4" />
          {company.city}
        </p>
      </Container>
    </section>
  );
}
