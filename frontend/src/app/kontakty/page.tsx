import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { ImageSlot } from "@/components/ui/image-slot";
import { MapCard } from "@/components/contacts/map-card";
import { ContactCards } from "@/components/contacts/contact-cards";
import { Schedule } from "@/components/contacts/schedule";
import { RequestForm } from "@/components/forms/request-form";
import { company } from "@/lib/content/company";

export const metadata: Metadata = {
  title: "Контакты",
  description: `Контакты Tabys Consulting: ${company.address}. Телефоны, email и форма заявки на подбор оборудования для пищевой промышленности.`,
};

const gallery = [
  { src: "/images/hero-main.jpg", alt: "Производственный цех Tabys Consulting" },
  { src: "/images/cat-cip.jpg", alt: "Участок сборки оборудования" },
  { src: "/images/cat-vacuum.jpg", alt: "Готовое оборудование перед отгрузкой" },
];

export default function ContactsPage() {
  return (
    <>
      <PageHero
        breadcrumb="Контакты"
        title="Контакты"
        titleAccent="Tabys Consulting"
        description="Свяжитесь с нами удобным способом. Мы проконсультируем по оборудованию, поможем подобрать решение и рассчитаем проект под вашу задачу."
      />

      <section className="bg-white py-14 lg:py-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <MapCard />
            </div>

            <div className="lg:col-span-5">
              <SectionLabel number="01">Contacts</SectionLabel>
              <h2 className="display-title mt-4 text-[clamp(1.5rem,4.5vw,2.25rem)] leading-[1.08]">
                Наши контакты
              </h2>
              <p className="mt-5 text-[14px] leading-relaxed text-text-2">
                Офис и производство расположены в Алматы. Работаем по всему Казахстану.
              </p>
              <div className="mt-7">
                <ContactCards />
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-muted py-14 lg:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7 xl:col-span-5">
              <SectionLabel number="02">Request</SectionLabel>
              <h2 className="display-title mt-4 text-[clamp(1.5rem,4.5vw,2.25rem)] leading-[1.08]">
                Оставить заявку
              </h2>
              <p className="mt-5 text-[14px] leading-relaxed text-text-2">
                Опишите вашу задачу — мы свяжемся с вами и предложим оптимальное решение.
              </p>
              <div className="mt-8">
                <RequestForm />
              </div>
            </div>

            <div className="lg:col-span-5 xl:col-span-3">
              <SectionLabel number="03">Work schedule</SectionLabel>
              <h2 className="display-title mt-4 text-[clamp(1.5rem,4.5vw,2.25rem)] leading-[1.08]">
                График работы
              </h2>
              <div className="mt-8">
                <Schedule />
              </div>
            </div>

            <div className="lg:col-span-12 xl:col-span-4">
              <SectionLabel number="04">How to get</SectionLabel>
              <h2 className="display-title mt-4 text-[clamp(1.5rem,4.5vw,2.25rem)] leading-[1.08]">
                Как к нам добраться
              </h2>
              <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-2">
                <ImageSlot
                  src={gallery[0].src}
                  alt={gallery[0].alt}
                  className="col-span-2 aspect-[16/10] w-full rounded-card lg:col-span-1 lg:aspect-[4/3] xl:col-span-2 xl:aspect-[16/10]"
                  sizes="(max-width: 1280px) 50vw, 25vw"
                />
                {gallery.slice(1).map((photo) => (
                  <ImageSlot
                    key={photo.src}
                    src={photo.src}
                    alt={photo.alt}
                    className="aspect-[4/3] w-full rounded-card"
                    sizes="(max-width: 1280px) 33vw, 12vw"
                  />
                ))}
              </div>
              <p className="mt-5 max-w-xl text-[13px] leading-relaxed text-text-2">
                Территория производства находится в {company.addressShort}. Въезд для
                транспорта со стороны улицы — ориентируйтесь на вывеску Tabys Consulting.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
