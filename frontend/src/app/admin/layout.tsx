import type { Metadata } from "next";

/**
 * Админка — всегда свежие данные под авторизацией, поэтому статической
 * оболочки у неё нет: каждый экран читает cookie и блокируется на сервере.
 *
 * `instant = false` — штатный способ это разрешить при cacheComponents
 * (см. docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/instant.md).
 * Без него каждое чтение cookie вне <Suspense> считается ошибкой: страница
 * не попадает в статическую оболочку. Оборачивать весь интерфейс в Suspense
 * ради этого смысла нет — ждать всё равно нечего, кроме самих данных.
 */
export const instant = false;

export const metadata: Metadata = {
  title: { default: "Админка", template: "%s — админка Tabys" },
  // Админка не должна попадать в поиск ни при какой конфигурации сервера.
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="flex min-h-full flex-1 flex-col bg-muted">{children}</div>;
}
