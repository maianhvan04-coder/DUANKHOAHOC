import bcrypt from "bcrypt";
import { UserModel } from "../user/user.model";
import { signAccessToken } from "../../helpers/jwt";
import { ROLES } from "../../constants/roles";
import { Session } from "./models/auth.session.model";
import { AccessToken } from "./models/auth.accessToken.model";
import { randomToken, sha256 } from "../../helpers/token.util";
import { getUserAccess, setRolesForUser } from "../rbac/rbac.service";

function addDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function accessExpiresAt() {
  const ms = Number(process.env.JWT_ACCESS_EXPIRES_MS || 15 * 60 * 1000);
  return new Date(Date.now() + ms);
}

function publicUser(user: {
  _id: unknown;
  name: string;
  email: string;
  avatar?: string | null;
}) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    avatar: user.avatar ?? null,
  };
}

async function issueAccessToken(params: {
  userId: string;
  email: string;
  sessionId: string;
}) {
  const access = await getUserAccess(params.userId);

  const { token: accessToken, jti } = signAccessToken({
    sub: params.userId,
    email: params.email,
    role: access.primaryRole,
  });

  await AccessToken.create({
    user: params.userId,
    session: params.sessionId,
    jti,
    tokenHash: sha256(accessToken),
    expiresAt: accessExpiresAt(),
  });

  return { accessToken, access };
}

export const authService = {
  async register(input: {
    name: string;
    email: string;
    password: string;
    ua?: string;
    ip?: string;
  }) {
    const existed = await UserModel.findOne({ email: input.email }).lean();

    if (existed) {
      const err = new Error("Email already exists") as Error & {
        statusCode?: number;
      };
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

    await setRolesForUser(String(user._id), [ROLES.USER]);

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

    const { accessToken, access } = await issueAccessToken({
      userId: String(user._id),
      email: user.email,
      sessionId: String(session._id),
    });

    return {
      accessToken,
      refreshToken,
      user: publicUser(user),
      access,
    };
  },

  async login(input: {
    email: string;
    password: string;
    ua?: string;
    ip?: string;
  }) {
    const user = await UserModel.findOne({ email: input.email });

    if (!user || !user.passwordHash) {
      const err = new Error("Invalid email or password") as Error & {
        statusCode?: number;
      };
      err.statusCode = 401;
      throw err;
    }

    const ok = await bcrypt.compare(input.password, user.passwordHash);

    if (!ok) {
      const err = new Error("Invalid email or password") as Error & {
        statusCode?: number;
      };
      err.statusCode = 401;
      throw err;
    }

    const oldSessions = await Session.find({ user: user._id }).select("_id");
    const oldIds = oldSessions.map((s) => s._id);

    if (oldIds.length) {
      await AccessToken.deleteMany({ session: { $in: oldIds } });
      await Session.deleteMany({ _id: { $in: oldIds } });
    }

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

    const { accessToken, access } = await issueAccessToken({
      userId: String(user._id),
      email: user.email,
      sessionId: String(session._id),
    });

    return {
      accessToken,
      refreshToken,
      user: publicUser(user),
      access,
    };
  },

  async refresh(input: {
    refreshToken: string;
    ua?: string;
    ip?: string;
  }) {
    const sess = await Session.findOne({
      refreshTokenHash: sha256(input.refreshToken),
      expiresAt: { $gt: new Date() },
      revokedAt: null,
    });

    if (!sess) {
      const err = new Error("Refresh token invalid") as Error & {
        statusCode?: number;
      };
      err.statusCode = 401;
      throw err;
    }

    const newRefresh = randomToken();
    sess.refreshTokenHash = sha256(newRefresh);
    sess.lastUsedAt = new Date();

    if (input.ua) sess.userAgent = input.ua;
    if (input.ip) sess.ip = input.ip;

    await sess.save();

    const user = await UserModel.findById(sess.user);

    if (!user) {
      const err = new Error("User not found") as Error & {
        statusCode?: number;
      };
      err.statusCode = 401;
      throw err;
    }

    await AccessToken.deleteMany({ session: sess._id });

    const { accessToken, access } = await issueAccessToken({
      userId: String(user._id),
      email: user.email,
      sessionId: String(sess._id),
    });

    return {
      accessToken,
      refreshToken: newRefresh,
      access,
    };
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