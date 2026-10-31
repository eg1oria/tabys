import { NextResponse } from "next/server";

/**
 * Редирект Route Handler'а на путь этого же сайта — относительным Location.
 *
 * NextResponse.redirect требует абсолютный URL, а собирать его от
 * request.url за обратным прокси нельзя: в standalone-сервере это адрес,
 * который слушает Next (http://0.0.0.0:3000), а не домен сайта. Редактора
 * с истёкшей сессией уводило на 0.0.0.0. Относительный адрес браузер
 * достраивает от того, что открыт у него, — прокси знать не нужно.
 *
 * path — только путь сайта (через safeNext), не внешний адрес.
 */
export function redirectToPath(path: string): NextResponse {
  return new NextResponse(null, { status: 307, headers: { Location: path } });
}

/** /admin/login с отметкой «сессия истекла» и адресом возврата. */
export function loginPath(next: string): string {
  const params = new URLSearchParams({ expired: "1" });
  if (next !== "/admin") params.set("next", next);
  return `/admin/login?${params}`;
}
