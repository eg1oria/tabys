"use server";

import { refresh, updateTag } from "next/cache";
import { apiMutate } from "../api/server";
import { CONTACTS_TAG } from "../api/public";
import { phoneDigits } from "../phone";
import { toFormState, withValues, type FormState } from "./form-state";
import { collectValues, text } from "./form-values";
import type { Contacts } from "../api/types";

const FIELDS = [
  "address",
  "addressShort",
  "mapUrl",
  "email",
  "phones",
  "whatsapp",
  "telegram",
  "instagram",
  "youtube",
] as const;

const LINKS = ["whatsapp", "telegram", "instagram", "youtube"] as const;

function isUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** Пары «подпись — номер» в порядке строк редактора; пустые строки отбрасываем. */
function phoneRows(formData: FormData): { label: string; phone: string }[] {
  const labels = formData.getAll("phoneLabel").map((v) => String(v).trim());
  const numbers = formData.getAll("phoneNumber").map((v) => String(v).trim());
  return labels
    .map((label, index) => ({ label, phone: numbers[index] ?? "" }))
    .filter((row) => row.label !== "" || row.phone !== "");
}

/**
 * Контакты сохраняются целиком. Проверки те же, что в UpdateContactsDto
 * на бэкенде, — здесь, чтобы ошибка встала под своим полем.
 */
export async function saveContacts(prev: FormState, formData: FormData): Promise<FormState> {
  const values = collectValues(formData);
  const fail = (state: FormState) => withValues(state, prev, values);

  const address = text(formData, "address");
  const addressShort = text(formData, "addressShort");
  const mapUrl = text(formData, "mapUrl");
  const email = text(formData, "email");
  const phones = phoneRows(formData);

  const errors: Record<string, string> = {};
  if (address.length < 5) errors.address = "Укажите адрес";
  if (addressShort.length < 3) errors.addressShort = "Укажите короткий адрес";
  if (!isUrl(mapUrl)) errors.mapUrl = "Нужна полная ссылка, с https://";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Это не похоже на адрес почты";
  if (phones.length === 0) {
    errors.phones = "Нужен хотя бы один номер";
  } else if (phones.length > 6) {
    errors.phones = "Не больше шести номеров";
  } else if (phones.some((row) => row.label === "")) {
    errors.phones = "У каждого номера должна быть подпись — имя или «Офис»";
  } else if (phones.some((row) => phoneDigits(row.phone) === null)) {
    errors.phones = "Номер в формате +7 (700) 000-00-00";
  }

  const links: Record<(typeof LINKS)[number], string | null> = {
    whatsapp: null,
    telegram: null,
    instagram: null,
    youtube: null,
  };
  for (const name of LINKS) {
    const value = text(formData, name);
    if (value !== "" && !isUrl(value)) errors[name] = "Нужна полная ссылка, с https://";
    links[name] = value === "" ? null : value;
  }

  if (Object.keys(errors).length > 0) return fail({ status: "error", errors });

  try {
    await apiMutate<Contacts>("/admin/contacts", {
      method: "PUT",
      json: { address, addressShort, mapUrl, email, phones, ...links },
    });
  } catch (error) {
    return fail(toFormState(error, FIELDS));
  }

  // Шапка и подвал всех страниц читают контакты под этим тегом.
  updateTag(CONTACTS_TAG);
  refresh();
  return { status: "success", errors: {} };
}
