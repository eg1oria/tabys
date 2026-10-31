import { connection } from "next/server";
import { apiUrl } from "@/lib/api/url";

type BackendHealth = { db?: "up" | "down" };

/**
 * Публичная проверка всей цепочки: Caddy → Next → бэкенд → база. Её
 * опрашивает внешний монитор (README, «Мониторинг»): 200 — всё живо,
 * 503 — бэкенд или база лежат, нет ответа — лежит сам сервер.
 *
 * Наружу только «up/down»: аптайм и прочие подробности /api/v1/health
 * посторонним ни к чему.
 */
export async function GET(): Promise<Response> {
  // Ответ на каждый запрос: закешированное «ok» сделало бы проверку слепой.
  await connection();

  let backend: "up" | "down" = "down";
  let db: "up" | "down" | "unknown" = "unknown";
  try {
    const response = await fetch(apiUrl("/health"), {
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    const body = (await response.json().catch(() => null)) as BackendHealth | null;
    backend = "up";
    db = body?.db ?? (response.ok ? "up" : "down");
  } catch {
    // Таймаут или отказ соединения — бэкенд недоступен.
  }

  const ok = backend === "up" && db === "up";
  return Response.json(
    { status: ok ? "ok" : "degraded", backend, db },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
