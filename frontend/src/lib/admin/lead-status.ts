import type { Tone } from "@/components/ui/badge";
import type { LeadStatus } from "../api/types";

/**
 * Зеркало TRANSITIONS из backend/src/modules/leads/leads.service.ts.
 * Нужно, чтобы не показывать кнопку перехода, который бэкенд отклонит
 * четырёхсотым. Источник правды — бэкенд: он проверяет переход сам,
 * и расхождение этой карты приведёт к понятной ошибке, а не к порче данных.
 */
export const LEAD_TRANSITIONS: Record<LeadStatus, readonly LeadStatus[]> = {
  NEW: ["IN_PROGRESS", "DONE", "SPAM"],
  IN_PROGRESS: ["DONE", "NEW", "SPAM"],
  DONE: ["IN_PROGRESS", "SPAM"],
  SPAM: ["NEW"],
};

export const LEAD_STATUSES: readonly LeadStatus[] = ["NEW", "IN_PROGRESS", "DONE", "SPAM"];

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: "Новая",
  IN_PROGRESS: "В работе",
  DONE: "Обработана",
  SPAM: "Спам",
};

/** Подпись на кнопке перехода — не то же, что название статуса. */
export const LEAD_TRANSITION_LABEL: Record<LeadStatus, string> = {
  NEW: "Вернуть в новые",
  IN_PROGRESS: "Взять в работу",
  DONE: "Обработана",
  SPAM: "Это спам",
};

export const LEAD_STATUS_TONE: Record<LeadStatus, Tone> = {
  NEW: "accent",
  IN_PROGRESS: "warn",
  DONE: "ok",
  SPAM: "neutral",
};

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === "string" && (LEAD_STATUSES as readonly string[]).includes(value);
}
