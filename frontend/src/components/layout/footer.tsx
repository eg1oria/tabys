import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { Socials } from "./socials";
import { Mail, Phone, Pin } from "@/components/ui/icons";
import { COPYRIGHT_YEAR, company, primaryPhone } from "@/lib/content/company";
import { categories } from "@/lib/content/categories";

const footerCatalog = categories.slice(0, 12);

export function Footer() {
  return (
    <footer className="bg-ink text-white">
      <Container className="grid gap-12 py-14 lg:grid-cols-12 lg:gap-8 lg:py-16">
        <div className="lg:col-span-3">
          <Logo />
          <p className="mt-6 max-w-[240px] text-[13px] leading-relaxed text-white/50">
            Производство оборудования для пищевой промышленности
          </p>
        </div>

        <div className="lg:col-span-5">
          <h2 className="section-label text-white/40">Каталог</h2>
          <ul className="mt-5 grid gap-x-8 gap-y-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {footerCatalog.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/oborudovanie?cat=${category.slug}`}
                  className="text-[13px] leading-snug text-white/70 transition-colors hover:text-accent"
                >
                  {category.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-4">
          <h2 className="section-label text-white/40">Контакты</h2>
          <ul className="mt-5 space-y-3.5 text-[13px] text-white/70">
            <li className="flex gap-3">
              <Pin className="mt-0.5 size-4 shrink-0 text-accent" />
              <span>{company.address}</span>
            </li>
            <li className="flex gap-3">
              <Phone className="mt-0.5 size-4 shrink-0 text-accent" />
              <a href={primaryPhone.href} className="transition-colors hover:text-accent">
                {primaryPhone.display}
              </a>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 size-4 shrink-0 text-accent" />
              <a
                href={`mailto:${company.email}`}
                className="transition-colors hover:text-accent"
              >
                {company.email}
              </a>
            </li>
          </ul>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Button href="/kontakty" arrow>
              Обсудить проект
            </Button>
            <Socials />
          </div>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-3 py-5 text-[12px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {COPYRIGHT_YEAR} {company.legalName}. Все права защищены.
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <Link
              href="/politika-konfidencialnosti"
              className="transition-colors hover:text-white/70"
            >
              Политика конфиденциальности
            </Link>
            <span>
              Разработка сайта — <span className="text-white/70">VXTGroup</span>
            </span>
          </div>
        </Container>
      </div>
    </footer>
  );
}
