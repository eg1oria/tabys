import { NextResponse, type NextRequest } from "next/server";
import { apiStreamRaw } from "@/lib/api/server";
import { ApiUnreachableError } from "@/lib/api/errors";

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

  let upstream: Response;
  try {
    upstream = await apiStreamRaw("/admin/media", {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: request.body,
    });
  } catch (error) {
    // Без этого любая сетевая ошибка превращалась в голый 500 без тела,
    // и форма загрузки показывала пустое сообщение.
    if (error instanceof ApiUnreachableError) {
      return NextResponse.json({ message: "Сервер админки не отвечает" }, { status: 503 });
    }
    throw error;
  }

  if (upstream.status === 401) {
    return NextResponse.json({ message: "Сессия истекла, войдите заново" }, { status: 401 });
  }

  const body: unknown = await upstream.json().catch(() => null);
  return NextResponse.json(body ?? { message: "Не удалось загрузить файл" }, {
    status: upstream.status,
  });
}
