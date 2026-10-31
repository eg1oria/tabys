import "server-only";
import { apiRead } from "./server";
import type { TelegramStatus } from "./types";

export function getTelegramStatus(): Promise<TelegramStatus> {
  return apiRead<TelegramStatus>("/admin/notifications/telegram");
}
