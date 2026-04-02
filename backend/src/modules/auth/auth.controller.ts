import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authService } from "./auth.service";
import { loginSchema, registerSchema } from "../../helpers/auth.schema";
import {
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
} from "../../helpers/auth.cookie";
import { createSecurityAuditService } from "../../modules/audit/security/security-audit.service";

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const payload = registerSchema.parse(req.body);

    try {
      const data = await authService.register({
        ...payload,
        ua: req.headers["user-agent"] as string,
        ip: req.ip,
      });

      await createSecurityAuditService({
        userId: data.user?.id || null,
        userName: data.user?.name || "",
        userEmail: data.user?.email || payload.email || "",
        action: "REGISTER_SUCCESS",
        method: req.method,
        path: req.originalUrl,
        ipAddress: req.ip,
        userAgent: String(req.headers["user-agent"] || ""),
        success: true,
        statusCode: 201,
        message: "Đăng ký thành công",
      });

      res.cookie(REFRESH_COOKIE_NAME, data.refreshToken, refreshCookieOptions());
      res.status(201).json({
        accessToken: data.accessToken,
        user: data.user,
        access: data.access,
      });
    } catch (error: any) {
      await createSecurityAuditService({
        userId: null,
        userName: "",
        userEmail: payload.email || "",
        action: "REGISTER_FAILED",
        method: req.method,
        path: req.originalUrl,
        ipAddress: req.ip,
        userAgent: String(req.headers["user-agent"] || ""),
        success: false,
        statusCode: 400,
        message: error?.message || "Đăng ký thất bại",
      });

      throw error;
    }
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const payload = loginSchema.parse(req.body);

    try {
      const data = await authService.login({
        ...payload,
        ua: req.headers["user-agent"] as string,
        ip: req.ip,
      });

      await createSecurityAuditService({
        userId: data.user?.id || null,
        userName: data.user?.name || "",
        userEmail: data.user?.email || payload.email || "",
        action: "LOGIN_SUCCESS",
        method: req.method,
        path: req.originalUrl,
        ipAddress: req.ip,
        userAgent: String(req.headers["user-agent"] || ""),
        success: true,
        statusCode: 200,
        message: "Đăng nhập thành công",
      });

      res.cookie(REFRESH_COOKIE_NAME, data.refreshToken, refreshCookieOptions());
      res.json({
        accessToken: data.accessToken,
        user: data.user,
        access: data.access,
      });
    } catch (error: any) {
      await createSecurityAuditService({
        userId: null,
        userName: "",
        userEmail: payload.email || "",
        action: "LOGIN_FAILED",
        method: req.method,
        path: req.originalUrl,
        ipAddress: req.ip,
        userAgent: String(req.headers["user-agent"] || ""),
        success: false,
        statusCode: 401,
        message: error?.message || "Đăng nhập thất bại",
      });

      throw error;
    }
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const rt = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

    if (!rt) {
      await createSecurityAuditService({
        userId: null,
        userName: "",
        userEmail: "",
        action: "REFRESH_FAILED",
        method: req.method,
        path: req.originalUrl,
        ipAddress: req.ip,
        userAgent: String(req.headers["user-agent"] || ""),
        success: false,
        statusCode: 401,
        message: "Missing refresh token",
      });

      return res.status(401).json({ message: "Missing refresh token" });
    }

    try {
      const data = await authService.refresh({
        refreshToken: rt,
        ua: req.headers["user-agent"] as string,
        ip: req.ip,
      });

      await createSecurityAuditService({
        userId: null,
        userName: "",
        userEmail: "",
        action: "REFRESH_SUCCESS",
        method: req.method,
        path: req.originalUrl,
        ipAddress: req.ip,
        userAgent: String(req.headers["user-agent"] || ""),
        success: true,
        statusCode: 200,
        message: "Refresh token thành công",
      });

      res.cookie(REFRESH_COOKIE_NAME, data.refreshToken, refreshCookieOptions());
      res.json({
        accessToken: data.accessToken,
        access: data.access,
      });
    } catch (error: any) {
      await createSecurityAuditService({
        userId: null,
        userName: "",
        userEmail: "",
        action: "REFRESH_FAILED",
        method: req.method,
        path: req.originalUrl,
        ipAddress: req.ip,
        userAgent: String(req.headers["user-agent"] || ""),
        success: false,
        statusCode: 401,
        message: error?.message || "Refresh token thất bại",
      });

      throw error;
    }
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const rt = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

    try {
      if (rt) {
        await authService.logout(rt);
      }

      await createSecurityAuditService({
        userId: req.user?.id || null,
        userName: req.user?.name || "",
        userEmail: req.user?.email || "",
        action: "LOGOUT_SUCCESS",
        method: req.method,
        path: req.originalUrl,
        ipAddress: req.ip,
        userAgent: String(req.headers["user-agent"] || ""),
        success: true,
        statusCode: 200,
        message: "Đăng xuất thành công",
      });

      res.clearCookie(REFRESH_COOKIE_NAME, {
        ...refreshCookieOptions(),
        maxAge: 0,
      });

      res.json({ ok: true });
    } catch (error: any) {
      await createSecurityAuditService({
        userId: req.user?.id || null,
        userName: req.user?.name || "",
        userEmail: req.user?.email || "",
        action: "LOGOUT_FAILED",
        method: req.method,
        path: req.originalUrl,
        ipAddress: req.ip,
        userAgent: String(req.headers["user-agent"] || ""),
        success: false,
        statusCode: 500,
        message: error?.message || "Đăng xuất thất bại",
      });

      throw error;
    }
  }),
};