// src/modules/auth/models/auth.accessToken.model.ts

import mongoose, { Schema, Types } from "mongoose";


export type Session = {
    _id: Types.ObjectId;
    user: Types.ObjectId;
    refreshTokenHash: string;
    expiresAt: Date;
    revokedAt?: Date | null;
    userAgent?: string;
    ip?: string;
    lastUsedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
};

const SessionSchema = new Schema<Session>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    refreshTokenHash: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, default: null },
    userAgent: { type: String, default: "" },
    ip: { type: String, default: "" },
    lastUsedAt: { type: Date },
  },
  { timestamps: true }
);

// TTL: tự dọn session hết hạn
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session =
  mongoose.models.Session || mongoose.model<Session>("Session", SessionSchema);