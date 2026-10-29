import { NextResponse, type NextRequest } from "next/server";
import { apiStream } from "@/lib/api/server";
import { ApiUnreachableError } from "@/lib/api/errors";

/**
 * Выгрузка каталога в CSV. Браузер не может сходить на бэкенд сам —
 * токен лежит в httpOnly-cookie и в JS его нет, поэтому запрос идёт
 * через сервер Next, а файл отдаётся потоком.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const search = request.nextUrl.search;

  let upstream: Response;
  try {
    upstream = await apiStream(`/admin/products/export${search}`);
  } catch (error) {
    if (error instanceof ApiUnreachableError) {
      return new NextResponse("Сервер админки не отвечает", { status: 503 });
    }
    throw error;
  }

  if (!upstream.ok || !upstream.body) {
    return new NextResponse("Не удалось выгрузить каталог", { status: upstream.status });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "text/csv; charset=utf-8",
      "content-disposition":
        upstream.headers.get("content-disposition") ?? 'attachment; filename="products.csv"',
      "cache-control": "no-store",
    },
  });
}
