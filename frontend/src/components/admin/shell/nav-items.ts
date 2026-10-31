import { Bell, Home, ImageIcon, Inbox, Layers, Sliders, Modules, User } from "@/components/ui/icons";

type Icon = (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;

export type NavLink = {
  href: string;
  label: string;
  Icon?: Icon;
  /** Подсвечивать только точное совпадение: иначе «Главная» активна везде. */
  exact?: boolean;
  /** Показать счётчик новых заявок. */
  badge?: boolean;
};

export type NavEntry = NavLink | { label: string; Icon: Icon; children: NavLink[] };

export const navEntries: NavEntry[] = [
  { href: "/admin", label: "Главная", Icon: Home, exact: true },
  { href: "/admin/leads", label: "Заявки", Icon: Inbox, badge: true },
  {
    label: "Каталог",
    Icon: Layers,
    children: [
      { href: "/admin/catalog/products", label: "Все товары", Icon: Modules },
      { href: "/admin/catalog/categories", label: "Категории", Icon: Layers },
      { href: "/admin/catalog/facets", label: "Параметры", Icon: Sliders },
    ],
  },
  { href: "/admin/media", label: "Файлы", Icon: ImageIcon },
  { href: "/admin/notifications", label: "Уведомления", Icon: Bell },
  { href: "/admin/profile", label: "Настройки", Icon: User },
];

export function isGroup(entry: NavEntry): entry is Extract<NavEntry, { children: NavLink[] }> {
  return "children" in entry;
}
