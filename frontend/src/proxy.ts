import { NextResponse, type NextProxy, type ProxyConfig } from "next/server";

/**
 * Оптимистичная проверка сессии перед рендером админки. В Next 16
 * middleware называется proxy (node_modules/next/dist/docs/01-app/
 * 01-getting-started/16-proxy.md).
 *
 * Здесь намеренно нет ни одного запроса к бэкенду: доки прямо пишут, что
 * proxy — не место для управления сессией, он выполняется в том числе для
 * префетчей. Реальная авторизация остаётся на бэкенде (JwtAuthGuard
 * перечитывает пользователя из базы на каждом запросе), а обновление
 * токена — в /api/admin/session, где cookie можно писать.
 *
 * Проверять можно только наличие cookie — и этого достаточно: maxAge
 * access-cookie равен времени жизни токена, поэтому «куки нет» означает
 * «токен истёк». Подписи здесь не проверить, и не нужно.
 */

const ACCESS_COOKIE = "tabys_at";
const REFRESH_COOKIE = "tabys_rt";

export const proxy: NextProxy = (request) => {
  const { pathname, search } = request.nextUrl;
  const hasAccess = request.cookies.has(ACCESS_COOKIE);
  const hasRefresh = request.cookies.has(REFRESH_COOKIE);

  if (pathname === "/admin/login") {
    // Уже вошли — форма входа ни к чему.
    return hasAccess
      ? NextResponse.redirect(new URL("/admin", request.url))
      : NextResponse.next();
  }

  if (!hasRefresh) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (!hasAccess) {
    const url = new URL("/api/admin/session", request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
};

/**
 * Только страницы админки. /api/admin/* сюда не входит осознанно: при
 * совпадении matcher'а Next буферизует тело запроса и молча обрезает его
 * на 10 МБ, а через эти маршруты идёт загрузка картинок до 10 МБ.
 * Авторизацию они проверяют сами.
 */
export const config: ProxyConfig = { matcher: "/admin/:path*" };
