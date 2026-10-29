import { NextResponse, type NextRequest } from "next/server";
import { apiStream } from "@/lib/api/server";

/**
 * Загрузка изображения. Это Route Handler, а не Server Action, потому что
 * тело Server Action ограничено 4 МБ (serverActions.bodySizeLimit), а
 * бэкенд принимает картинки до 10 МБ. У Route Handler такого лимита нет.
 *
 * Тело передаём потоком — файл не оказывается целиком в памяти Next.
 * Content-Type копируем вместе с boundary, иначе multipart не разобрать.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const contentType = request.headers.get("content-type");
  if (!contentType?.startsWith("multipart/form-data")) {
    return NextResponse.json({ message: "Ожидается multipart/form-data" }, { status: 400 });
  }

  const upstream = await apiStream("/admin/media", {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: request.body,
  });

  const body: unknown = await upstream.json().catch(() => null);
  return NextResponse.json(body ?? { message: "Не удалось загрузить файл" }, {
    status: upstream.status,
  });
}
