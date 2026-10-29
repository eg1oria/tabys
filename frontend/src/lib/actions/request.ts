"use server";

import { headers } from "next/headers";
import { apiUrl } from "@/lib/api/url";
import {
  ALLOWED_EXTENSIONS,
  MAX_FILE_BYTES,
  type RequestState,
} from "./request-state";

type RequestFields = {
  name: string;
  phone: string;
  email: string;
  message: string;
  companyWebsite: string;
  renderedAt: string;
};

/**
 * Единственное место, где заявка покидает приложение. Уходит в бэкенд
 * (POST /public/leads) с сервера Next, поэтому адрес API в браузер
 * не попадает.
 *
 * Раньше здесь был console.info — заявки с сайта просто терялись.
 * Отсюда правило: «успех» возвращаем только после ответа 2xx.
 */
async function deliverRequest(
  fields: RequestFields,
  file: File | null,
): Promise<RequestState> {
  const body = new FormData();
  body.set("name", fields.name);
  body.set("phone", fields.phone);
  body.set("consent", "true");
  if (fields.email) body.set("email", fields.email);
  if (fields.message) body.set("message", fields.message);
  if (fields.companyWebsite) body.set("companyWebsite", fields.companyWebsite);
  if (fields.renderedAt) body.set("renderedAt", fields.renderedAt);
  if (file) body.set("attachment", file, file.name);

  // Content-Type не ставим руками: boundary для multipart генерирует fetch.
  const incoming = await headers();
  const forwarded = incoming.get("x-forwarded-for") ?? incoming.get("x-real-ip");
  const outgoing = new Headers();
  // Иначе бэкенд увидит адрес сервера Next у каждой заявки и запишет его
  // в Lead.ip, а лимит «20 в час на IP» станет общим для всех посетителей.
  // Работает только если на бэкенде включён TRUST_PROXY.
  if (forwarded) outgoing.set("x-forwarded-for", forwarded);
  const userAgent = incoming.get("user-agent");
  if (userAgent) outgoing.set("user-agent", userAgent);

  let response: Response;
  try {
    response = await fetch(apiUrl("/public/leads"), {
      method: "POST",
      headers: outgoing,
      body,
      cache: "no-store",
      // Лежащий бэкенд не должен держать форму до таймаута воркера.
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    console.error("[Заявка] бэкенд недоступен", error);
    return { status: "error", errors: { _form: FALLBACK_MESSAGE } };
  }

  if (response.ok) return { status: "success", errors: {} };

  if (response.status === 429) {
    return {
      status: "error",
      errors: {
        _form:
          "Слишком много заявок за короткое время. Напишите нам в WhatsApp или позвоните — телефоны в шапке сайта.",
      },
    };
  }

  // 400 от валидации: показываем сообщения бэкенда, они на русском и
  // написаны один в один с правилами этой формы.
  if (response.status < 500) {
    const messages = await errorMessages(response);
    if (messages.length > 0) {
      return { status: "error", errors: { _form: messages.join(". ") } };
    }
  }

  console.error(`[Заявка] бэкенд ответил ${response.status}`);
  return { status: "error", errors: { _form: FALLBACK_MESSAGE } };
}

const FALLBACK_MESSAGE =
  "Не удалось отправить заявку. Позвоните нам или напишите в WhatsApp — так быстрее.";

async function errorMessages(response: Response): Promise<string[]> {
  try {
    const body: unknown = await response.json();
    if (body === null || typeof body !== "object") return [];
    const envelope = body as { message?: unknown; errors?: unknown };
    if (Array.isArray(envelope.errors)) {
      const list = envelope.errors.filter((e): e is string => typeof e === "string");
      if (list.length > 0) return list;
    }
    return typeof envelope.message === "string" ? [envelope.message] : [];
  } catch {
    return [];
  }
}

function digits(value: string) {
  return value.replace(/\D/g, "");
}

export async function submitRequest(
  _prev: RequestState,
  formData: FormData,
): Promise<RequestState> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const consent = formData.get("consent");
  const file = formData.get("attachment");

  const errors: Record<string, string> = {};

  if (name.length < 2) {
    errors.name = "Укажите ваше имя";
  }

  const phoneDigits = digits(phone);
  if (phoneDigits.length < 10) {
    errors.phone = "Укажите корректный номер телефона";
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.email = "Проверьте адрес электронной почты";
  }

  if (message.length > 5000) {
    errors.message = "Сообщение слишком длинное";
  }

  let attachment: File | null = null;
  if (file instanceof File && file.size > 0) {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (file.size > MAX_FILE_BYTES) {
      errors.attachment = "Файл больше 4 МБ — пришлите его на почту или в WhatsApp";
    } else if (!ALLOWED_EXTENSIONS.includes(extension)) {
      errors.attachment = "Неподдерживаемый формат файла";
    } else {
      attachment = file;
    }
  }

  if (!consent) {
    errors.consent = "Нужно согласие на обработку данных";
  }

  if (Object.keys(errors).length > 0) {
    return { status: "error", errors };
  }

  return deliverRequest(
    {
      name,
      phone,
      email,
      message,
      companyWebsite: String(formData.get("companyWebsite") ?? ""),
      renderedAt: String(formData.get("renderedAt") ?? ""),
    },
    attachment,
  );
}
