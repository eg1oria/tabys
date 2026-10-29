import { NextResponse, type NextRequest } from "next/server";
import { refreshTokens } from "@/lib/api/refresh";
import { REFRESH_COOKIE, clearTokensOn, setTokensOn } from "@/lib/api/session";
import { safeNext } from "@/lib/admin/form-state";

/**
 * Обновление сессии. Сюда редиректит proxy.ts, когда access-cookie
 * истекла, а refresh ещё жива: записать новую пару cookie страница не
 * может, а Route Handler — может. Обновив, возвращаем пользователя туда,
 * куда он шёл.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (!refreshToken) return toLogin(request, next);

  try {
    const pair = await refreshTokens(refreshToken);
    const response = NextResponse.redirect(new URL(next, request.url));
    setTokensOn(response, pair);
    return response;
  } catch {
    // Семейство токенов отозвано или бэкенд недоступен — на логин,
    // предварительно убрав мёртвые cookie, иначе proxy.ts зациклит редирект.
    const response = toLogin(request, next);
    clearTokensOn(response);
    return response;
  }
}

function toLogin(request: NextRequest, next: string): NextResponse {
  const url = new URL("/admin/login", request.url);
  url.searchParams.set("next", next);
  url.searchParams.set("expired", "1");
  return NextResponse.redirect(url);
}
