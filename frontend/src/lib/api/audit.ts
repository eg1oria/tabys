import "server-only";
import { apiRead } from "./server";
import { searchString } from "./url";
import type { AuditEntry, Paginated } from "./types";

/** Журнал действий админки, новые сверху. Только для владельца. */
export function getAudit(params: {
  entity?: string;
  entityId?: string;
  actorId?: string;
  page?: number;
}): Promise<Paginated<AuditEntry>> {
  return apiRead<Paginated<AuditEntry>>(
    `/admin/audit${searchString({ ...params, perPage: 30 })}`,
  );
}
