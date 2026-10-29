"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ImageIcon, Inbox, Layers, Modules, Sliders, User } from "@/components/ui/icons";

type Item = {
  href: "/admin/leads" | "/admin/catalog/categories" | "/admin/catalog/products" | "/admin/catalog/facets" | "/admin/media" | "/admin/profile";
  label: string;
  Icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;
};

const items: Item[] = [
  { href: "/admin/leads", label: "Заявки", Icon: Inbox },
  { href: "/admin/catalog/categories", label: "Категории", Icon: Layers },
  { href: "/admin/catalog/products", label: "Товары", Icon: Modules },
  { href: "/admin/catalog/facets", label: "Фильтры", Icon: Sliders },
  { href: "/admin/media", label: "Медиа", Icon: ImageIcon },
  { href: "/admin/profile", label: "Профиль", Icon: User },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Разделы админки" className="flex gap-1 md:flex-col">
      {items.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            // Префетч выключен осознанно: страницы админки динамические,
            // кешировать их нечем, а каждый префетч — это ещё один запрос,
            // способный совпасть с обновлением токена.
            prefetch={false}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-card px-3 py-2 text-[13px] font-medium whitespace-nowrap transition-colors",
              active ? "bg-white/12 text-white" : "text-white/55 hover:bg-white/8 hover:text-white",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
