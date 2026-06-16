import { Types } from "mongoose";
import {
  createSecurityAuditRepo,
  getAdminSecurityAuditsRepo,
  getMySecurityAuditsRepo,
} from "./security-audit.repo";

type CreateSecurityAuditInput = {
  userId?: string | null;
  userName?: string;
  userEmail?: string;
  action: string;
  method?: string;
  path?: string;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  statusCode?: number;
  message?: string;
  meta?: Record<string, unknown>;
};

function toObjectIdOrNull(value?: string | null) {
  if (!value) return null;
  return Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : null;
}

function mapAuditItem(item: any) {
  const populatedUser =
    item?.user && typeof item.user === "object" && item.user._id
      ? {
          _id: String(item.user._id),
          name: item.user.name || item.userName || "",
          email: item.user.email || item.userEmail || "",
        }
      : null;

  return {
    _id: String(item._id),
    action: item.action || "",
    method: item.method || "",
    path: item.path || "",
    ipAddress: item.ipAddress || "",
    userAgent: item.userAgent || "",
    success: Boolean(item.success),
    statusCode: Number(item.statusCode || 0),
    message: item.message || "",
    meta: item.meta || {},
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    userName: item.userName || "",
    userEmail: item.userEmail || "",
    user:
      populatedUser ||
      (item.userName || item.userEmail
        ? {
            _id: "",
            name: item.userName || "",
            email: item.userEmail || "",
          }
        : null),
  };
}

export async function createSecurityAuditService(input: CreateSecurityAuditInput) {
  return createSecurityAuditRepo({
    user: toObjectIdOrNull(input.userId),
    userName: input.userName || "",
    userEmail: (input.userEmail || "").toLowerCase(),
    action: input.action,
    method: input.method || "",
    path: input.path || "",
    ipAddress: input.ipAddress || "",
    userAgent: input.userAgent || "",
    success: input.success ?? true,
    statusCode: input.statusCode ?? 200,
    message: input.message || "",
    meta: input.meta || {},
  });
}

export async function getAdminSecurityAuditsService(query: {
  page: number;
  limit: number;
  keyword?: string;
  email?: string;
  path?: string;
  ipAddress?: string;
  action?: string;
  success?: boolean;
}) {
  const result = await getAdminSecurityAuditsRepo(query);

  return {
    items: result.items.map(mapAuditItem),
    pagination: result.pagination,
  };
}

export async function getMySecurityAuditsService(query: {
  userId: string;
  page: number;
  limit: number;
  action?: string;
  success?: boolean;
}) {
  const result = await getMySecurityAuditsRepo(query);

  return {
    items: result.items.map(mapAuditItem),
    pagination: result.pagination,
  };
}