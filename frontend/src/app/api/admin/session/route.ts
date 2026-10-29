import { NextResponse, type NextRequest } from "next/server";
import { refreshTokens } from "@/lib/api/refresh";
import { ApiUnreachableError } from "@/lib/api/errors";
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
  } catch (error) {
    // Бэкенд не ответил — сессия ни при чём, cookie не трогаем: иначе
    // короткий сбой сети разлогинивал бы всех редакторов. Отвечаем
    // страницей, а не редиректом: любой адрес под /admin снова привёл бы
    // сюда же (access-cookie по-прежнему нет) — получилась бы петля.
    if (error instanceof ApiUnreachableError) return offline(next);
    // Семейство токенов отозвано — на логин, предварительно убрав мёртвые
    // cookie, иначе proxy.ts зациклит редирект.
    const response = toLogin(request, next);
    clearTokensOn(response);
    return response;
  }
}

function offline(next: string): NextResponse {
  const retry = next.replace(/"/g, "");
  return new NextResponse(
    `<!doctype html><html lang="ru"><meta charset="utf-8">
     <meta name="viewport" content="width=device-width,initial-scale=1">
     <title>Сервер админки не отвечает</title>
     <style>
       body{font:15px/1.6 system-ui,sans-serif;margin:0;display:grid;place-items:center;
            min-height:100vh;background:#f4f5f7;color:#0b0d0f}
       div{max-width:30rem;padding:2rem;background:#fff;border:1px solid #e3e6ea;border-radius:4px}
       a{color:#0b84f3}
     </style>
     <div>
       <h1>Сервер админки не отвечает</h1>
       <p>Сессия цела — не удалось связаться с бэкендом. Проверьте, запущен ли он, и повторите.</p>
       <p><a href="/api/admin/session?next=${retry}">Повторить</a></p>
     </div>`,
    { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

function toLogin(request: NextRequest, next: string): NextResponse {
  const url = new URL("/admin/login", request.url);
  url.searchParams.set("next", next);
  url.searchParams.set("expired", "1");
  return NextResponse.redirect(url);
}
