import "server-only";
import { apiRead } from "./server";
import type { Contacts } from "./types";

export function getAdminContacts(): Promise<Contacts> {
  return apiRead<Contacts>("/admin/contacts");
}
