import { NextResponse, type NextRequest } from "next/server";
import { clearTokensOn } from "@/lib/api/session";
import { safeNext } from "@/lib/admin/form-state";

/**
 * Принудительный выход. Нужен потому, что Server Component не может
 * стереть cookie: при 401 от бэкенда страница уводит сюда, здесь cookie
 * чистятся, и только после этого человек попадает на форму входа.
 *
 * Без этого шага proxy.ts видел живую access-cookie и возвращал с логина
 * обратно в админку — браузер крутился между двумя адресами.
 */
export function GET(request: NextRequest): NextResponse {
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  const url = new URL("/admin/login", request.url);
  url.searchParams.set("expired", "1");
  if (next !== "/admin") url.searchParams.set("next", next);

  const response = NextResponse.redirect(url);
  clearTokensOn(response);
  return response;
}
