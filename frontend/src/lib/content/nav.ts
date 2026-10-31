export type NavLink = { label: string; href: string };

export type NavItem = NavLink & {
  children?: NavLink[];
};

/**
 * Навигация сайта. Подменю «Оборудование» — опубликованные категории
 * из админки: их передаёт layout, сам список здесь не хранится.
 */
export function buildNav(catalog: NavLink[]): NavItem[] {
  return [
    { label: "О компании", href: "/o-kompanii" },
    { label: "Оборудование", href: "/oborudovanie", children: catalog.slice(0, 8) },
    { label: "Производственные линии", href: "/proizvodstvennye-linii" },
    { label: "Услуги", href: "/uslugi" },
    { label: "Проекты", href: "/proekty" },
    { label: "Контакты", href: "/kontakty" },
  ];
}
