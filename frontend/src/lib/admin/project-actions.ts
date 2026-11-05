"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { apiMutate } from "../api/server";
import { CATALOG_TAG } from "../api/public";
import { formError, toFormState, withValues, type FormState } from "./form-state";
import { collectValues, lines, nullableText, text } from "./form-values";
import type { AdminProject } from "../api/types";

const FIELDS = ["title", "subtitle", "location", "year", "scope", "imageId"] as const;

/**
 * Проекты сайт читает под тем же тегом, что и каталог (getProjects в
 * lib/api/public.ts), — его и сбрасываем, чтобы правка была видна сразу.
 */
function revalidateSite() {
  updateTag(CATALOG_TAG);
}

export async function saveProject(prev: FormState, formData: FormData): Promise<FormState> {
  const id = text(formData, "id");
  const title = text(formData, "title");
  const scope = lines(formData, "scope");
  const values = collectValues(formData);
  const fail = (state: FormState) => withValues(state, prev, values);

  const errors: Record<string, string> = {};
  if (title.length < 2) errors.title = "Название не короче двух символов";
  if (text(formData, "year").length > 20) errors.year = "Год — коротко, например 2024 или 2023–2024";
  if (scope.length > 20) errors.scope = "Не больше двадцати пунктов";
  if (scope.some((item) => item.length > 200)) errors.scope = "Пункт не длиннее 200 символов";
  if (Object.keys(errors).length > 0) return fail({ status: "error", errors });

  const body = {
    title,
    subtitle: text(formData, "subtitle"),
    location: text(formData, "location"),
    year: text(formData, "year"),
    scope,
    imageId: nullableText(formData, "imageId"),
    status: text(formData, "published") === "on" ? "PUBLISHED" : "DRAFT",
  };

  let created: AdminProject | undefined;
  try {
    if (id) {
      await apiMutate<AdminProject>(`/admin/projects/${id}`, { method: "PATCH", json: body });
    } else {
      created = await apiMutate<AdminProject>("/admin/projects", { method: "POST", json: body });
    }
  } catch (error) {
    return fail(toFormState(error, FIELDS));
  }

  revalidateSite();
  // redirect бросает исключение — только вне try.
  if (created) redirect(`/admin/projects/${created.id}`);
  refresh();
  return { status: "success", errors: {} };
}

export async function setProjectStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = text(formData, "id");
  if (!id) return formError("Не указан проект");
  const status = text(formData, "action") === "publish" ? "PUBLISHED" : "DRAFT";

  try {
    await apiMutate<AdminProject>(`/admin/projects/${id}`, { method: "PATCH", json: { status } });
  } catch (error) {
    return toFormState(error);
  }

  revalidateSite();
  refresh();
  return { status: "success", errors: {} };
}

export async function deleteProject(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = text(formData, "id");
  if (!id) return formError("Не указан проект");

  try {
    await apiMutate<void>(`/admin/projects/${id}`, { method: "DELETE" });
  } catch (error) {
    // Удалять может только владелец — 403 придёт сюда с пояснением.
    return toFormState(error);
  }

  revalidateSite();
  redirect("/admin/projects");
}

export async function reorderProjects(_prev: FormState, formData: FormData): Promise<FormState> {
  const items = formData
    .getAll("order")
    .filter((v): v is string => typeof v === "string" && v !== "")
    .map((id, index) => ({ id, sortOrder: index }));
  if (items.length === 0) return formError("Нечего упорядочивать");

  try {
    await apiMutate<void>("/admin/projects/reorder", { method: "PATCH", json: { items } });
  } catch (error) {
    return toFormState(error);
  }

  revalidateSite();
  refresh();
  return { status: "success", errors: {} };
}
