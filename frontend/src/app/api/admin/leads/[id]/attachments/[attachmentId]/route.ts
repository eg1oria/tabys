import { NextResponse, type NextRequest } from "next/server";
import { apiStream } from "@/lib/api/server";

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

  const upstream = await apiStream(`/admin/leads/${id}/attachments/${attachmentId}`);

  if (!upstream.ok || !upstream.body) {
    return new NextResponse("Вложение недоступно", { status: upstream.status });
  }

  const headers = new Headers();
  for (const name of ["content-type", "content-length", "content-disposition"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("x-content-type-options", "nosniff");

  return new NextResponse(upstream.body, { status: 200, headers });
}
