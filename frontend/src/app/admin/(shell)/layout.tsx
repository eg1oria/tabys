import { Suspense } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { LogoutButton, UserBadge, UserBadgeSkeleton } from "@/components/admin/user-badge";

/**
 * Оболочка авторизованной части. Страница входа лежит вне этой группы,
 * поэтому сайдбар на ней не появляется.
 *
 * Сессию здесь намеренно не ждём на верхнем уровне: await на /auth/me
 * задержал бы вместе с собой и {children} (см. «Push dynamic access down»
 * в docs/01-app/02-guides/authentication-with-cache-components.md).
 */
export default function AdminShellLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-5 bg-ink p-4 md:w-[232px] md:p-5">
        <div className="flex items-center justify-between gap-4 md:block">
          <Link href="/admin" prefetch={false} className="block leading-none">
            <span className="block font-display text-[17px] font-extrabold tracking-[0.02em] text-white">
              TABYS
            </span>
            <span className="mt-0.5 block font-display text-[9px] font-semibold tracking-[0.38em] text-white/45">
              АДМИНКА
            </span>
          </Link>
          <span className="flex items-center gap-4 md:mt-4 md:block">
            <Link
              href="/"
              prefetch={false}
              className="text-[12px] text-white/45 transition-colors hover:text-white"
            >
              ← на сайт
            </Link>
            {/* Полная карточка пользователя ниже — она прячется на узких
                экранах, поэтому выход дублируем здесь. */}
            <span className="md:hidden">
              <LogoutButton />
            </span>
          </span>
        </div>

        {/* На узких экранах разделы прокручиваются лентой — без JS и бургера. */}
        <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:flex-1 md:overflow-visible md:px-0">
          <AdminNav />
        </div>

        <div className="hidden md:block">
          <Suspense fallback={<UserBadgeSkeleton />}>
            <UserBadge />
          </Suspense>
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
