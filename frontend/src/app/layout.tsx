import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { SITE_URL, company } from "@/lib/content/company";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700", "800", "900"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Tabys Consulting — оборудование для пищевой промышленности",
    template: "%s — Tabys Consulting",
  },
  description:
    "Проектируем, производим и комплектуем оборудование из нержавеющей стали для пищевых производств. Собственное производство в Алматы, работаем по всему Казахстану.",
  keywords: [
    "оборудование для пищевой промышленности",
    "ёмкости из нержавеющей стали",
    "пастеризационное оборудование",
    "сыроварни",
    "охладители молока",
    "Алматы",
    "Казахстан",
  ],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: company.shortName,
    title: "Tabys Consulting — оборудование для пищевой промышленности",
    description:
      "От отдельных единиц оборудования до комплексных производственных линий. Изготовление по техническому заданию.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      data-scroll-behavior="smooth"
      className={`${montserrat.variable} ${inter.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-surface text-ink">
        {children}
      </body>
    </html>
  );
}
