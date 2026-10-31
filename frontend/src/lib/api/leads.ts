import "server-only";
import { apiRead } from "./server";
import { searchString } from "./url";
import type { Lead, LeadStatus, Paginated } from "./types";

export function getLeads(params: {
  status?: LeadStatus;
  q?: string;
  /** false — только заявки, о которых Telegram не уведомил. */
  notified?: boolean;
  page?: number;
  perPage?: number;
}): Promise<Paginated<Lead>> {
  return apiRead<Paginated<Lead>>(
    `/admin/leads${searchString({
      ...params,
      notified: params.notified === undefined ? undefined : String(params.notified),
      perPage: params.perPage ?? 20,
    })}`,
  );
}

export function getLead(id: string): Promise<Lead> {
  return apiRead<Lead>(`/admin/leads/${id}`);
}
