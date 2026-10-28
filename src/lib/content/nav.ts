import { categories } from "./categories";

export type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

export const nav: NavItem[] = [
  { label: "О компании", href: "/o-kompanii" },
  {
    label: "Оборудование",
    href: "/oborudovanie",
    children: categories.slice(0, 8).map((c) => ({
      label: c.title,
      href: `/oborudovanie?cat=${c.slug}`,
    })),
  },
  { label: "Производственные линии", href: "/proizvodstvennye-linii" },
  { label: "Услуги", href: "/uslugi" },
  { label: "Проекты", href: "/proekty" },
  { label: "Контакты", href: "/kontakty" },
];
