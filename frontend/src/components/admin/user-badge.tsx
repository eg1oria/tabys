import { apiRead } from "@/lib/api/server";
import { logout } from "@/lib/admin/auth-actions";
import { LogOut } from "@/components/ui/icons";
import type { CurrentUser } from "@/lib/api/types";

/**
 * Текущий администратор. Живёт внутри <Suspense> в оболочке: запрос к
 * /auth/me не должен задерживать отрисовку сайдбара и самой страницы.
 */
export async function UserBadge() {
  const me = await apiRead<CurrentUser>("/auth/me");

  return (
    <div className="border-t border-white/10 pt-4">
      <p className="truncate text-[13px] font-medium text-white">{me.name}</p>
      <p className="mt-0.5 truncate text-[11.5px] text-white/45">{me.email}</p>
      <p className="mt-1 text-[11px] tracking-[0.08em] text-white/35 uppercase">
        {me.role === "OWNER" ? "владелец" : "редактор"}
      </p>

      <form action={logout} className="mt-3">
        <button
          type="submit"
          className="flex w-full items-center gap-2 rounded-card px-2.5 py-2 text-[12.5px] font-medium text-white/55 transition-colors hover:bg-white/8 hover:text-white"
        >
          <LogOut className="size-4" />
          Выйти
        </button>
      </form>
    </div>
  );
}

export function UserBadgeSkeleton() {
  return (
    <div className="border-t border-white/10 pt-4">
      <span className="block h-3.5 w-28 rounded bg-white/12" />
      <span className="mt-2 block h-3 w-36 rounded bg-white/8" />
    </div>
  );
}

/** Компактный выход для узких экранов, где полная карточка не помещается. */
export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="flex items-center gap-1.5 text-[12px] text-white/45 transition-colors hover:text-white"
      >
        <LogOut className="size-4" />
        Выйти
      </button>
    </form>
  );
}
