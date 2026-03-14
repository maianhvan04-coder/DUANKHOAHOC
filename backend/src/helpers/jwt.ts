// src/helpers/jwt.ts

import jwt, { type SignOptions } from "jsonwebtoken";
import { Role } from "../constants/roles";
import { uuid } from "./token.util";

export type JwtPayload = { sub: string; email: string; role: Role; jti: string };

function getAccessSecret() {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("Missing JWT_ACCESS_SECRET in .env");
  return secret;
}

export function signAccessToken(payload: Omit<JwtPayload, "jti">) {
  const secret = getAccessSecret();
  const expiresIn = (process.env.JWT_ACCESS_EXPIRES || "15m") as SignOptions["expiresIn"];

  const jti = uuid();
  const token = jwt.sign({ ...payload, jti }, secret, { expiresIn });

  return { token, jti };
}

export function verifyAccessToken(token: string) {
  const secret = getAccessSecret();
  return jwt.verify(token, secret) as JwtPayload & jwt.JwtPayload;
}

