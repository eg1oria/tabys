"use server";

import { refresh } from "next/cache";
import { apiMutate } from "../api/server";
import { toFormState, type FormState } from "./form-state";
import type { MediaAsset } from "../api/types";

export async function updateMediaAlt(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const alt = String(formData.get("alt") ?? "");

  try {
    await apiMutate<MediaAsset>(`/admin/media/${id}`, { method: "PATCH", json: { alt } });
  } catch (error) {
    return toFormState(error, ["alt"]);
  }

  refresh();
  return { status: "success", errors: {} };
}

export async function deleteMedia(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");

  try {
    await apiMutate<void>(`/admin/media/${id}`, { method: "DELETE" });
  } catch (error) {
    // Используемую картинку бэкенд не отдаёт удалить и объясняет, почему.
    return toFormState(error);
  }

  refresh();
  return { status: "success", errors: {} };
}
