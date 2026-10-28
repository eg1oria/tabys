import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { Container } from "@/components/ui/container";
import { company } from "@/lib/content/company";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  description:
    "Политика в отношении обработки персональных данных пользователей сайта Tabys Consulting.",
  robots: { index: false, follow: true },
};

const sections = [
  {
    title: "1. Общие положения",
    paragraphs: [
      `Настоящая политика описывает порядок обработки персональных данных, которые ${company.legalName} («Компания») получает от пользователей сайта.`,
      "Используя сайт и отправляя заявку через форму обратной связи, пользователь подтверждает согласие с условиями настоящей политики.",
    ],
  },
  {
    title: "2. Какие данные мы собираем",
    paragraphs: [
      "Через форму заявки Компания получает имя, номер телефона, адрес электронной почты, текст сообщения и файл, если пользователь прикрепил его самостоятельно.",
      "Компания не собирает специальные категории персональных данных и не запрашивает платёжные реквизиты через сайт.",
    ],
  },
  {
    title: "3. Цели обработки",
    paragraphs: [
      "Данные используются только для связи с пользователем по его обращению: консультации по оборудованию, подготовки коммерческого предложения и согласования деталей проекта.",
      "Компания не передаёт персональные данные третьим лицам и не использует их для рассылок, на которые пользователь не давал согласия.",
    ],
  },
  {
    title: "4. Хранение и защита",
    paragraphs: [
      "Данные хранятся столько, сколько необходимо для обработки обращения и ведения деловой переписки, после чего удаляются.",
      "Компания принимает разумные организационные и технические меры для защиты данных от несанкционированного доступа.",
    ],
  },
  {
    title: "5. Права пользователя",
    paragraphs: [
      `Пользователь вправе запросить информацию об обработке своих данных, их уточнение или удаление, направив обращение на ${company.email}.`,
    ],
  },
  {
    title: "6. Контакты",
    paragraphs: [
      `${company.legalName}, ${company.address}. Электронная почта: ${company.email}.`,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        breadcrumb="Политика конфиденциальности"
        title="Политика"
        titleAccent="конфиденциальности"
        description="Как мы обрабатываем персональные данные, которые вы оставляете через формы на сайте."
      />

      <section className="bg-white py-14 lg:py-20">
        <Container>
          <div className="max-w-3xl">
            {sections.map((section) => (
              <section key={section.title} className="border-b border-line py-8 first:pt-0 last:border-b-0">
                <h2 className="font-display text-[16px] font-bold uppercase tracking-[0.01em]">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-3.5 text-[14px] leading-relaxed text-text-2">
                  {section.paragraphs.map((text) => (
                    <p key={text}>{text}</p>
                  ))}
                </div>
              </section>
            ))}

            <p className="mt-10 rounded-card bg-muted p-5 text-[13px] leading-relaxed text-text-2">
              Это типовой текст политики. Перед публикацией сайта его нужно согласовать с
              юристом компании и при необходимости дополнить реквизитами и ссылками на
              законодательство Республики Казахстан.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
