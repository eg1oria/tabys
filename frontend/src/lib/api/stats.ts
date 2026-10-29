import "server-only";
import { apiRead } from "./server";
import { searchString } from "./url";
import type { AdminStats } from "./types";

/** Сводка для главной. Период — даты YYYY-MM-DD включительно. */
export function getStats(params: { from?: string; to?: string } = {}): Promise<AdminStats> {
  return apiRead<AdminStats>(`/admin/stats${searchString(params)}`);
}
