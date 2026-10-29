import { Sidebar } from "@/components/admin/shell/sidebar";
import { SidebarProvider } from "@/components/admin/shell/sidebar-state";
import { Topbar } from "@/components/admin/shell/topbar";

/**
 * Оболочка авторизованной части. Страница входа лежит вне этой группы,
 * поэтому сайдбар на ней не появляется.
 *
 * Сессию здесь намеренно не ждём на верхнем уровне: await на /auth/me
 * задержал бы вместе с собой и {children} (см. «Push dynamic access down»
 * в docs/01-app/02-guides/authentication-with-cache-components.md).
 * Поэтому и карточка пользователя, и счётчик заявок — каждый в своём
 * <Suspense> внутри Topbar и Sidebar.
 */
export default function AdminShellLayout({ children }: LayoutProps<"/admin">) {
  return (
    <SidebarProvider>
      <div className="flex min-h-full flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
