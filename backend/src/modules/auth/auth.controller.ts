import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authService } from "./auth.service";
import { loginSchema, registerSchema } from "../../helpers/auth.schema";

import { REFRESH_COOKIE_NAME, refreshCookieOptions } from "../../helpers/auth.cookie";

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const payload = registerSchema.parse(req.body);

    const data = await authService.register({
      ...payload,
      ua: req.headers["user-agent"] as string,
      ip: req.ip,
    });

    res.cookie(REFRESH_COOKIE_NAME, data.refreshToken, refreshCookieOptions());
    res.status(201).json({ accessToken: data.accessToken, user: data.user });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const payload = loginSchema.parse(req.body);

    const data = await authService.login({
      ...payload,
      ua: req.headers["user-agent"] as string,
      ip: req.ip,
    });

    res.cookie(REFRESH_COOKIE_NAME, data.refreshToken, refreshCookieOptions());
    res.json({ accessToken: data.accessToken, user: data.user });
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const rt = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!rt) return res.status(401).json({ message: "Missing refresh token" });

    const data = await authService.refresh({
      refreshToken: rt,
      ua: req.headers["user-agent"] as string,
      ip: req.ip,
    });

    res.cookie(REFRESH_COOKIE_NAME, data.refreshToken, refreshCookieOptions());
    res.json({ accessToken: data.accessToken });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const rt = req.cookies?.[REFRESH_COOKIE_NAME];
    if (rt) await authService.logout(rt);

    // ✅ thoát ra là refresh mất luôn ở cookie
    res.clearCookie(REFRESH_COOKIE_NAME, { ...refreshCookieOptions(), maxAge: 0 });
    res.json({ ok: true });
  }),
};
