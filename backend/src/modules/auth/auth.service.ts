import bcrypt from "bcrypt";
import { UserModel } from "../user/user.model";
import { signAccessToken } from "../../helpers/jwt"; // ✅ import đúng file jwt có jti (đổi path nếu bạn khác)
import { ROLES } from "../../constants/roles";

import { Session } from "./models/auth.session.model";
import { AccessToken } from "./models/auth.accessToken.model";
import { randomToken, sha256 } from "../../helpers/token.util";

function addDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function accessExpiresAt() {
  const ms = Number(process.env.JWT_ACCESS_EXPIRES_MS || 15 * 60 * 1000);
  return new Date(Date.now() + ms);
}

export const authService = {
  async register(input: { name: string; email: string; password: string; ua?: string; ip?: string }) {
    const existed = await UserModel.findOne({ email: input.email }).lean();
    if (existed) {
      const err: any = new Error("Email already exists");
      err.statusCode = 409;
      throw err;
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await UserModel.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: ROLES.USER,
    });

    // ✅ tạo refresh session
    const refreshToken = randomToken();
    const refreshDays = Number(process.env.JWT_REFRESH_DAYS || 7);

    const session = await Session.create({
      user: user._id,
      refreshTokenHash: sha256(refreshToken),
      expiresAt: addDays(refreshDays),
      userAgent: input.ua || "",
      ip: input.ip || "",
      lastUsedAt: new Date(),
    });

    // ✅ access token + lưu DB
    const { token: accessToken, jti } = signAccessToken({
      sub: String(user._id),
      email: user.email,
      role: user.role,
    });

    await AccessToken.create({
      user: user._id,
      session: session._id,
      jti,
      tokenHash: sha256(accessToken),
      expiresAt: accessExpiresAt(),
    });

    return {
      accessToken,
      refreshToken, // controller sẽ set cookie, không trả ra FE
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  },

  async login(input: { email: string; password: string; ua?: string; ip?: string }) {
    const user = await UserModel.findOne({ email: input.email });
    if (!user || !user.passwordHash) {
      const err: any = new Error("Invalid email or password");
      err.statusCode = 401;
      throw err;
    }

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      const err: any = new Error("Invalid email or password");
      err.statusCode = 401;
      throw err;
    }

    // ✅ 1) XOÁ TOÀN BỘ phiên cũ của user (single-session)
    const oldSessions = await Session.find({ user: user._id }).select("_id");
    const oldIds = oldSessions.map((s) => s._id);

    if (oldIds.length) {
      await AccessToken.deleteMany({ session: { $in: oldIds } });
      await Session.deleteMany({ _id: { $in: oldIds } });
    }

    // ✅ 2) tạo refresh session mới
    const refreshToken = randomToken();
    const refreshDays = Number(process.env.JWT_REFRESH_DAYS || 7);

    const session = await Session.create({
      user: user._id,
      refreshTokenHash: sha256(refreshToken),
      expiresAt: addDays(refreshDays),
      userAgent: input.ua || "",
      ip: input.ip || "",
      lastUsedAt: new Date(),
    });

    // ✅ 3) access token + lưu DB
    const { token: accessToken, jti } = signAccessToken({
      sub: String(user._id),
      email: user.email,
      role: user.role,
    });

    await AccessToken.create({
      user: user._id,
      session: session._id,
      jti,
      tokenHash: sha256(accessToken),
      expiresAt: accessExpiresAt(),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  },

  async refresh(input: { refreshToken: string; ua?: string; ip?: string }) {
    const sess = await Session.findOne({
      refreshTokenHash: sha256(input.refreshToken),
      expiresAt: { $gt: new Date() },
    });

    if (!sess) {
      const err: any = new Error("Refresh token invalid");
      err.statusCode = 401;
      throw err;
    }

    // rotate refresh
    const newRefresh = randomToken();
    sess.refreshTokenHash = sha256(newRefresh);
    sess.lastUsedAt = new Date();
    if (input.ua) sess.userAgent = input.ua;
    if (input.ip) sess.ip = input.ip;
    await sess.save();

    const user = await UserModel.findById(sess.user);
    if (!user) {
      const err: any = new Error("User not found");
      err.statusCode = 401;
      throw err;
    }

    const { token: accessToken, jti } = signAccessToken({
      sub: String(user._id),
      email: user.email,
      role: user.role,
    });

    await AccessToken.create({
      user: user._id,
      session: sess._id,
      jti,
      tokenHash: sha256(accessToken),
      expiresAt: accessExpiresAt(),
    });

    return { accessToken, refreshToken: newRefresh };
  },

  async logout(refreshToken: string) {
    const sess = await Session.findOne({
      refreshTokenHash: sha256(refreshToken),
    });

    if (!sess) return;

    await AccessToken.deleteMany({ session: sess._id });
    await Session.deleteOne({ _id: sess._id });
  },
};
