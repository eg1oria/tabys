"use server";

import {
  ALLOWED_EXTENSIONS,
  MAX_FILE_BYTES,
  type RequestState,
} from "./request-state";

type RequestPayload = {
  name: string;
  phone: string;
  email: string;
  message: string;
  attachment: { name: string; size: number } | null;
};

/**
 * Единственное место, где заявка покидает приложение.
 * Сейчас пишем в лог сервера; чтобы подключить Telegram или почту,
 * достаточно заменить тело этой функции — форма и валидация не меняются.
 */
async function deliverRequest(payload: RequestPayload) {
  console.info("[Заявка с сайта]", {
    ...payload,
    receivedAt: new Date().toISOString(),
  });
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

  let attachment: RequestPayload["attachment"] = null;
  if (file instanceof File && file.size > 0) {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (file.size > MAX_FILE_BYTES) {
      errors.attachment = "Файл больше 4 МБ — пришлите его на почту или в WhatsApp";
    } else if (!ALLOWED_EXTENSIONS.includes(extension)) {
      errors.attachment = "Неподдерживаемый формат файла";
    } else {
      attachment = { name: file.name, size: file.size };
    }
  }

  if (!consent) {
    errors.consent = "Нужно согласие на обработку данных";
  }

  if (Object.keys(errors).length > 0) {
    return { status: "error", errors };
  }

  await deliverRequest({ name, phone, email, message, attachment });

  return { status: "success", errors: {} };
}
