import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../../helpers/jwt";
import { AccessToken } from "../../modules/auth/models/auth.accessToken.model";
import { sha256 } from "../../helpers/token.util";
import { getUserAccess } from "../../modules/rbac/rbac.service";

export async function authGuard(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ message: "Thiếu access token" });
  }

  try {
    const payload = verifyAccessToken(token);

    const hit = await AccessToken.findOne({
      user: payload.sub,
      jti: payload.jti,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
      tokenHash: sha256(token),
    }).lean();

    if (!hit) {
      return res.status(401).json({
        message: "Token đã bị thu hồi hoặc đã hết hạn",
      });
    }

    const access = await getUserAccess(String(payload.sub));

    req.user = {
      id: String(payload.sub),
      email: String(payload.email),
      role: access.primaryRole,
      roles: access.roles,
      permissions: access.permissions,
    };

    return next();
  } catch {
    return res.status(401).json({
      message: "Token không hợp lệ hoặc đã hết hạn",
    });
  }
}