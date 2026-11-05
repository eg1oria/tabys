import "server-only";
import { apiRead } from "./server";
import type { AdminProject } from "./types";

/** Проектов единицы — бэкенд отдаёт весь список по порядку. */
export function getAdminProjects(): Promise<AdminProject[]> {
  return apiRead<AdminProject[]>("/admin/projects");
}

export function getAdminProject(id: string): Promise<AdminProject> {
  return apiRead<AdminProject>(`/admin/projects/${id}`);
}
