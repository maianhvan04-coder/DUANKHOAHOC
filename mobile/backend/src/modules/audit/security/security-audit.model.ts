import { Schema, model, models, type Types } from "mongoose";

export type SecurityAuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "REGISTER"
  | "REFRESH_TOKEN"
  | "ACCESS_GRANTED"
  | "ACCESS_DENIED"
  | "PASSWORD_CHANGED"
  | "PASSWORD_RESET_REQUEST"
  | "PASSWORD_RESET_SUCCESS";

export interface SecurityAuditEntity {
  user: Types.ObjectId | null;
  userName: string;
  userEmail: string;
  action: SecurityAuditAction | string;
  method: string;
  path: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  statusCode: number;
  message: string;
  meta: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

const securityAuditSchema = new Schema<SecurityAuditEntity>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    userName: {
      type: String,
      trim: true,
      default: "",
    },
    userEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    method: {
      type: String,
      trim: true,
      default: "",
    },
    path: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    ipAddress: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    userAgent: {
      type: String,
      trim: true,
      default: "",
    },
    success: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    statusCode: {
      type: Number,
      default: 200,
    },
    message: {
      type: String,
      trim: true,
      default: "",
    },
    meta: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

securityAuditSchema.index({ createdAt: -1 });
securityAuditSchema.index({ action: 1, success: 1 });
securityAuditSchema.index({ user: 1, createdAt: -1 });
securityAuditSchema.index({ userEmail: 1, createdAt: -1 });

export const SecurityAuditModel =
  models.SecurityAudit || model<SecurityAuditEntity>("SecurityAudit", securityAuditSchema);