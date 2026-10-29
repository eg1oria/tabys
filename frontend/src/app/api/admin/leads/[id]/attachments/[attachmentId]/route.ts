import { NextResponse, type NextRequest } from "next/server";
import { apiStream } from "@/lib/api/server";
import { ApiUnreachableError } from "@/lib/api/errors";

/**
 * Скачивание вложения заявки. В них чертежи и ТЗ заказчиков, поэтому
 * статикой они не раздаются — только отсюда, под авторизацией.
 *
 * Тело бэкенда пробрасываем потоком: файл не оказывается в памяти Next,
 * а заголовки (включая Content-Disposition с кириллицей) бэкенд уже
 * выставил правильно.
 */
export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/admin/leads/[id]/attachments/[attachmentId]">,
): Promise<NextResponse> {
  const { id, attachmentId } = await ctx.params;

  let upstream: Response;
  try {
    // Идентификаторы из адреса — в путь запроса только закодированными.
    upstream = await apiStream(
      `/admin/leads/${encodeURIComponent(id)}/attachments/${encodeURIComponent(attachmentId)}`,
    );
  } catch (error) {
    if (error instanceof ApiUnreachableError) {
      return new NextResponse("Сервер админки не отвечает", { status: 503 });
    }
    throw error;
  }

  if (!upstream.ok || !upstream.body) {
    return new NextResponse("Вложение недоступно", { status: upstream.status });
  }

  const headers = new Headers();
  for (const name of ["content-type", "content-length", "content-disposition"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("x-content-type-options", "nosniff");
  // Документы заказчиков не должны оседать в кеше браузера и прокси.
  headers.set("cache-control", "no-store");

  return new NextResponse(upstream.body, { status: 200, headers });
}
