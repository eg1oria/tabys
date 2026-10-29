import Link from "next/link";
import { apiRead } from "@/lib/api/server";
import { logout } from "@/lib/admin/auth-actions";
import { ChevronDown, ExternalLink, LogOut, User } from "@/components/ui/icons";
import type { CurrentUser } from "@/lib/api/types";

/** Инициалы для круглого аватара: «Саня Иванов» → «СИ». */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((part) => part[0]).join("");
  return (letters || "?").toUpperCase();
}

/**
 * Карточка администратора в шапке. Меню на <details> — раскрытие умеет
 * сам браузер, клиентский компонент ради этого не нужен.
 */
export async function UserMenu() {
  const me = await apiRead<CurrentUser>("/auth/me");

  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-card py-1 pr-2 pl-1 transition-colors hover:bg-muted">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/10 text-[12px] font-semibold text-accent">
          {initials(me.name)}
        </span>
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block truncate text-[13px] font-medium">{me.name}</span>
          <span className="block truncate text-[11.5px] text-text-2">
            {me.role === "OWNER" ? "Владелец" : "Редактор"}
          </span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-text-2" />
      </summary>

      <div className="absolute right-0 z-20 mt-2 w-60 rounded-card border border-line bg-white p-1.5 shadow-lg">
        <p className="truncate px-2.5 py-2 text-[12px] text-text-2">{me.email}</p>
        <Link
          href="/admin/profile"
          prefetch={false}
          className="flex items-center gap-2.5 rounded-card px-2.5 py-2 text-[13px] transition-colors hover:bg-muted"
        >
          <User className="size-4 text-text-2" />
          Профиль и пароль
        </Link>
        <Link
          href="/"
          prefetch={false}
          className="flex items-center gap-2.5 rounded-card px-2.5 py-2 text-[13px] transition-colors hover:bg-muted"
        >
          <ExternalLink className="size-4 text-text-2" />
          Открыть сайт
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-card px-2.5 py-2 text-[13px] text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="size-4" />
            Выйти
          </button>
        </form>
      </div>
    </details>
  );
}

export function UserMenuSkeleton() {
  return (
    <span className="flex items-center gap-2.5 py-1 pr-2 pl-1">
      <span className="size-9 shrink-0 rounded-full bg-muted" />
      <span className="hidden sm:block">
        <span className="block h-3 w-24 rounded bg-muted" />
        <span className="mt-1.5 block h-2.5 w-16 rounded bg-muted" />
      </span>
    </span>
  );
}

/** Выход в самом низу сайдбара — как на макете. */
export function SidebarLogout() {
  return (
    <form action={logout} className="border-t border-white/10 p-3">
      <button
        type="submit"
        className="flex w-full items-center gap-2.5 rounded-card px-3 py-2 text-[13px] font-medium text-white/55 transition-colors hover:bg-white/8 hover:text-white"
      >
        <LogOut className="size-4" />
        Выйти
      </button>
    </form>
  );
}
