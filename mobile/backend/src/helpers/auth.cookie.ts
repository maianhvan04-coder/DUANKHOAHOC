// src/helpers/auth.cookie.ts
import type { CookieOptions } from "express";

export const REFRESH_COOKIE_NAME = "rt";

export function refreshCookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === "production";
  const days = Number(process.env.JWT_REFRESH_DAYS || 7);

  return {
    httpOnly: true,
    secure: isProd,                  // dev: false
    sameSite: isProd ? "none" : "lax",
    path: "/api/auth",               // ✅ ĐÚNG (match /api/auth/refresh)
    maxAge: days * 24 * 60 * 60 * 1000,
  };
}
