import type { ContactPhone, Contacts } from "@/lib/api/types";

/**
 * Адрес сайта для canonical, sitemap, Open Graph и JSON-LD. Встраивается
 * при сборке. Умолчания для прода нет намеренно: раньше здесь стоял
 * tabys-consulting.vercel.app, и сборка без переменной молча отдавала
 * поисковикам чужой домен. Vercel к тому же не подходит в принципе: файлы
 * каталога и вложения заявок живут на диске бэкенда (README, «Деплой»).
 */
export const SITE_URL = (() => {
  const value = process.env.NEXT_PUBLIC_SITE_URL;
  if (value) return value.replace(/\/+$/, "");
  if (process.env.NODE_ENV === "production") {
    throw new Error("Не задан NEXT_PUBLIC_SITE_URL — адрес сайта (см. .env.example)");
  }
  return "http://localhost:3000";
})();

/** Постоянное: название и город. Адрес, телефоны и ссылки — в админке. */
export const company = {
  name: "ТАБЫС CONSULTING",
  shortName: "Табыс Consulting",
  legalName: "ТОО «Табыс Consulting»",
  tagline: "Производство оборудования\nдля пищевой промышленности",
  city: "Алматы, Казахстан",
} as const;

/**
 * Контакты на случай, когда бэкенд недоступен (сборка без него, сбой).
 * Настоящие правятся в админке, раздел «Контакты», — см. getContacts
 * в lib/api/public.ts. Эти же значения миграция положила в базу.
 */
export const defaultContacts: Contacts = {
  address: "ул. Осипенко 35/А, Алматы, Казахстан",
  addressShort: "ул. Осипенко 35/А",
  mapUrl: "https://2gis.kz/almaty/search/%D0%9E%D1%81%D0%B8%D0%BF%D0%B5%D0%BD%D0%BA%D0%BE%2035%D0%90",
  email: "pro_service7@mail.ru",
  phones: [
    { label: "Дмитрий", digits: "77072671237", display: "+7 (707) 267-12-37" },
    { label: "Андрей", digits: "77052862686", display: "+7 (705) 286-26-86" },
    { label: "Александр", digits: "77067065426", display: "+7 (706) 706-54-26" },
  ],
  whatsapp: "https://wa.me/77072671237",
  telegram: "https://t.me/+77072671237",
  instagram: null,
  youtube: null,
};

export function phoneHref(phone: ContactPhone): string {
  return `tel:+${phone.digits}`;
}

/**
 * Главный номер — первый в списке. Бэкенд не сохранит контакты без
 * номеров, но на всякий случай подставляем номер из кода.
 */
export function primaryPhone(contacts: Contacts): ContactPhone {
  return contacts.phones[0] ?? defaultContacts.phones[0];
}

export const schedule = [
  { day: "Понедельник", hours: "09:00 – 18:00" },
  { day: "Вторник", hours: "09:00 – 18:00" },
  { day: "Среда", hours: "09:00 – 18:00" },
  { day: "Четверг", hours: "09:00 – 18:00" },
  { day: "Пятница", hours: "09:00 – 18:00" },
  { day: "Суббота", hours: "Выходной", off: true },
  { day: "Воскресенье", hours: "Выходной", off: true },
] as const;
