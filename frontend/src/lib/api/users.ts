import "server-only";
import { apiRead } from "./server";
import type { AdminAccount, AdminUserOption } from "./types";

export function getAdminUsers(): Promise<AdminUserOption[]> {
  return apiRead<AdminUserOption[]>("/admin/users");
}

/** Все учётные записи, включая отключённые. Только для владельца. */
export function getAdminAccounts(): Promise<AdminAccount[]> {
  return apiRead<AdminAccount[]>("/admin/users/all");
}
