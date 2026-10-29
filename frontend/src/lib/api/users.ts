import "server-only";
import { apiRead } from "./server";
import type { AdminUserOption } from "./types";

export function getAdminUsers(): Promise<AdminUserOption[]> {
  return apiRead<AdminUserOption[]>("/admin/users");
}
