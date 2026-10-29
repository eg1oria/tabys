import Link from "next/link";
import { Suspense } from "react";
import { LeadsDot } from "./leads-badge";
import { SidebarToggle } from "./sidebar-state";
import { UserMenu, UserMenuSkeleton } from "./user-menu";
import { Bell, Search } from "@/components/ui/icons";
import { fieldBase, fieldBorder } from "@/components/ui/field";
import { cn } from "@/lib/utils";

/**
 * Шапка админки: поиск, уведомления, карточка пользователя.
 *
 * Поиск — обычная GET-форма на /admin/search, без клиентского состояния.
 * Данные под авторизацией (имя и счётчик) живут в своих <Suspense>,
 * чтобы не задерживать содержимое страницы.
 */
export function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-white px-4 py-2.5 lg:px-8">
      <SidebarToggle />

      <form action="/admin/search" method="get" className="relative min-w-0 max-w-xl flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-text-2" />
        <input
          type="search"
          name="q"
          maxLength={100}
          placeholder="Поиск по товарам, категориям, артикулу…"
          aria-label="Поиск по админке"
          className={cn(fieldBase, "h-10 rounded-full pl-10", fieldBorder(false))}
        />
      </form>

      <Link
        href="/admin/leads?status=NEW"
        prefetch={false}
        aria-label="Новые заявки"
        className="relative grid size-9 shrink-0 place-items-center rounded-card text-text-2 transition-colors hover:bg-muted hover:text-ink"
      >
        <Bell className="size-5" />
        <Suspense fallback={null}>
          <LeadsDot />
        </Suspense>
      </Link>

      <Suspense fallback={<UserMenuSkeleton />}>
        <UserMenu />
      </Suspense>
    </header>
  );
}
