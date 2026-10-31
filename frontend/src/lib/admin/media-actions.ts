"use server";

import { refresh, updateTag } from "next/cache";
import { apiMutate } from "../api/server";
import { CATALOG_TAG } from "../api/public";
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

  updateTag(CATALOG_TAG);
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

  updateTag(CATALOG_TAG);
  refresh();
  return { status: "success", errors: {} };
}
