// src/middlewares/authGuard.ts
import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../../helpers/jwt";
import { AccessToken } from "../../modules/auth/models/auth.accessToken.model";
import { sha256 } from "../../helpers/token.util"; // chỉnh đúng path theo project bạn

export async function authGuard(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ message: "Missing access token" });
  }

  try {
    const payload = verifyAccessToken(token);

    // ✅ check token có tồn tại trong DB và chưa bị revoke
    const hit = await AccessToken.findOne({
      user: payload.sub,
      jti: payload.jti,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
      tokenHash: sha256(token), // nếu bạn có lưu tokenHash
    }).lean();

    if (!hit) {
      return res.status(401).json({ message: "Token revoked/expired" });
    }

    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid/Expired token" });
  }
}
