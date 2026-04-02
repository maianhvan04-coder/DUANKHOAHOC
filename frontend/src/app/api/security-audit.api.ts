import { http } from "@/lib/utils/http";

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

export type SecurityAuditItem = {
  _id: string;
  action: string;
  method: string;
  path: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  statusCode: number;
  message: string;
  createdAt: string;
  updatedAt: string;
  userName?: string;
  userEmail?: string;
  meta?: Record<string, unknown>;
  user?: {
    _id: string;
    name: string;
    email: string;
  } | null;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type SecurityAuditListResponse = {
  ok: true;
  items: SecurityAuditItem[];
  pagination: Pagination;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function unwrapPayload(raw: unknown): UnknownRecord {
  if (!isRecord(raw)) return {};
  if (isRecord(raw.data)) return raw.data;
  return raw;
}

function normalizePagination(value: unknown): Pagination {
  const pagination = isRecord(value) ? value : {};

  return {
    page: typeof pagination.page === "number" ? pagination.page : 1,
    limit: typeof pagination.limit === "number" ? pagination.limit : 10,
    total: typeof pagination.total === "number" ? pagination.total : 0,
    totalPages:
      typeof pagination.totalPages === "number" ? pagination.totalPages : 1,
  };
}

function normalizeListResponse(raw: unknown): SecurityAuditListResponse {
  const payload = unwrapPayload(raw);

  return {
    ok: true,
    items: Array.isArray(payload.items)
      ? (payload.items as SecurityAuditItem[])
      : [],
    pagination: normalizePagination(payload.pagination),
  };
}

export const securityAuditApi = {
  async getMine(params?: {
    page?: number;
    limit?: number;
    action?: string;
    success?: boolean;
  }) {
    const { data } = await http.get("/api/security-audits/me", { params });
    return normalizeListResponse(data);
  },

  async getAdminList(params?: {
    page?: number;
    limit?: number;
    keyword?: string;
    email?: string;
    path?: string;
    ipAddress?: string;
    action?: string;
    success?: boolean;
  }) {
    const nextParams: Record<string, unknown> = { ...params };

    if (typeof nextParams.success === "boolean") {
      nextParams.success = String(nextParams.success);
    }

    const { data } = await http.get("/api/security-audits/admin", {
      params: nextParams,
    });

    return normalizeListResponse(data);
  },
};