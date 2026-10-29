import "server-only";
import { apiRead } from "./server";
import { searchString } from "./url";
import type { Lead, LeadStatus, Paginated } from "./types";

export function getLeads(params: {
  status?: LeadStatus;
  q?: string;
  page?: number;
}): Promise<Paginated<Lead>> {
  return apiRead<Paginated<Lead>>(
    `/admin/leads${searchString({ ...params, perPage: 20 })}`,
  );
}

export function getLead(id: string): Promise<Lead> {
  return apiRead<Lead>(`/admin/leads/${id}`);
}
