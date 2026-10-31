import { NextResponse, type NextProxy, type ProxyConfig } from "next/server";

/**
 * Два дела, оба без запросов к бэкенду:
 *   — старые адреса каталога /oborudovanie?cat=<слаг> → страница категории;
 *   — оптимистичная проверка сессии перед рендером админки.
 *
 * В Next 16 middleware называется proxy (node_modules/next/dist/docs/01-app/
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

/**
 * До отдельных страниц категория открывалась параметром ?cat= — такие
 * ссылки уже в поиске, закладках и старом sitemap. 308 переносит их вес
 * на новый адрес. Слаг не проверяем: несуществующий получит 404 там.
 */
function legacyCatalogRedirect(url: URL): NextResponse | null {
  const cat = url.searchParams.get("cat");
  if (!cat || !/^[a-z0-9-]+$/.test(cat)) return null;
  const target = new URL(`/oborudovanie/${cat}`, url);
  return NextResponse.redirect(target, 308);
}

export const proxy: NextProxy = (request) => {
  const { pathname, search, searchParams } = request.nextUrl;

  if (pathname === "/oborudovanie") {
    return legacyCatalogRedirect(request.nextUrl) ?? NextResponse.next();
  }
  const hasAccess = request.cookies.has(ACCESS_COOKIE);
  const hasRefresh = request.cookies.has(REFRESH_COOKIE);

  if (pathname === "/admin/login") {
    // Сессию уже признали недействительной — на форму входа пропускаем
    // даже с живой cookie, иначе получается петля: страница отвечает
    // «войдите», а proxy возвращает обратно в админку.
    if (searchParams.has("expired")) return NextResponse.next();
    // Уже вошли — форма входа ни к чему.
    return hasAccess && hasRefresh
      ? NextResponse.redirect(new URL("/admin", request.url))
      : NextResponse.next();
  }

  if (!hasRefresh) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    const response = NextResponse.redirect(url);
    // Access-cookie без refresh — обрубок сессии: обновить её нечем.
    // Оставить её значит снова попасть в ветку «уже вошли» выше.
    response.cookies.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  }

  if (!hasAccess) {
    const url = new URL("/api/admin/session", request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
};

/**
 * Оглавление каталога и страницы админки. /api/admin/* сюда не входит осознанно: при
 * совпадении matcher'а Next буферизует тело запроса и молча обрезает его
 * на 10 МБ, а через эти маршруты идёт загрузка картинок до 10 МБ.
 * Авторизацию они проверяют сами.
 */
export const config: ProxyConfig = { matcher: ["/oborudovanie", "/admin/:path*"] };
