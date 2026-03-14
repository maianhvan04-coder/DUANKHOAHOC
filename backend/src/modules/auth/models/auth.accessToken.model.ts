// src/modules/auth/models/auth.accessToken.model.ts

import mongoose, { Schema, Types } from "mongoose";


export type AccessToken = {
    _id: Types.ObjectId;
    user: Types.ObjectId;
    session: Types.ObjectId;
    jti: string;
    tokenHash: string;
    expiresAt: Date;
    revokedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

const AccessTokenSchema = new Schema<AccessToken>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        session: { type: Schema.Types.ObjectId, ref: "Session", required: true, index: true },
        jti: { type: String, required: true, unique: true, index: true },
        tokenHash: { type: String, required: true },
        expiresAt: { type: Date, required: true, index: true },
        revokedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

// TTL: tự dọn access token hết hạn
AccessTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AccessToken =
  mongoose.models.AccessToken || mongoose.model<AccessToken>("AccessToken", AccessTokenSchema);