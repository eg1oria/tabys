import "server-only";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { TokenPair } from "./types";

/**
 * Сессия админки — два httpOnly-cookie. Токены никогда не попадают в JS
 * браузера: все запросы к Nest уходят с сервера Next.
 *
 * path=/ , а не /admin: Route Handler'ы админки живут в /api/admin/*
 * (они специально вне matcher'а proxy.ts, иначе тело загрузки буферизуется),
 * и cookie с path=/admin до них бы не дошли.
 */
export const ACCESS_COOKIE = "tabys_at";
export const REFRESH_COOKIE = "tabys_rt";

const COOKIE_PATH = "/";
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // JWT_REFRESH_TTL по умолчанию — 30d

/**
 * Запас в 30 секунд: cookie должна умереть раньше самого токена, иначе
 * запрос, попавший в последние миллисекунды жизни, получит 401 и выкинет
 * администратора на логин. Наличие cookie означает «токен точно ещё жив».
 */
const EXPIRY_SKEW_SECONDS = 30;

function base() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: COOKIE_PATH,
  };
}

export function accessCookieOptions(expiresIn: number) {
  return { ...base(), maxAge: Math.max(EXPIRY_SKEW_SECONDS, expiresIn - EXPIRY_SKEW_SECONDS) };
}

export function refreshCookieOptions() {
  return { ...base(), maxAge: REFRESH_MAX_AGE };
}

export async function readTokens(): Promise<{
  accessToken?: string;
  refreshToken?: string;
}> {
  const jar = await cookies();
  return {
    accessToken: jar.get(ACCESS_COOKIE)?.value,
    refreshToken: jar.get(REFRESH_COOKIE)?.value,
  };
}

/** Писать cookie можно только из Server Action или Route Handler. */
export async function writeTokens(pair: TokenPair): Promise<void> {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, pair.accessToken, accessCookieOptions(pair.expiresIn));
  jar.set(REFRESH_COOKIE, pair.refreshToken, refreshCookieOptions());
}

export async function clearTokens(): Promise<void> {
  const jar = await cookies();
  jar.delete({ name: ACCESS_COOKIE, path: COOKIE_PATH });
  jar.delete({ name: REFRESH_COOKIE, path: COOKIE_PATH });
}

/** Для Route Handler, который отдаёт готовый NextResponse (редирект). */
export function setTokensOn(response: NextResponse, pair: TokenPair): void {
  response.cookies.set(ACCESS_COOKIE, pair.accessToken, accessCookieOptions(pair.expiresIn));
  response.cookies.set(REFRESH_COOKIE, pair.refreshToken, refreshCookieOptions());
}

export function clearTokensOn(response: NextResponse): void {
  response.cookies.set(ACCESS_COOKIE, "", { ...base(), maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { ...base(), maxAge: 0 });
}
