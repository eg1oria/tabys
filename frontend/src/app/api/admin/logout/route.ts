import { NextResponse, type NextRequest } from "next/server";
import { clearTokensOn } from "@/lib/api/session";
import { safeNext } from "@/lib/admin/form-state";
import { loginPath, redirectToPath } from "@/lib/admin/redirect";

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
  const response = redirectToPath(loginPath(next));
  clearTokensOn(response);
  return response;
}
