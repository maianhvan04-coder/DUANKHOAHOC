import { http } from "@/lib/utils/http";

export type PaymentHistoryProvider = "vnpay" | "payos" | (string & {});
export type PaymentHistoryStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED";
export type PaymentHistoryTransactionType =
  | "TOPUP"
  | "ENROLL"
  | "REFUND"
  | "ADMIN_DEBIT";
export type PaymentHistorySortKey =
  | "paymentCode"
  | "provider"
  | "amount"
  | "status"
  | "createdAt"
  | "paidAt";
export type PaymentHistorySortOrder = "asc" | "desc";

export type PaymentOrderItem = {
  courseId: string;
  title: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type PaymentAuditUser = {
  _id: string;
  name: string;
  email: string;
} | null;

export type PaymentAuditItem = {
  _id: string;
  paymentCode: number;
  transactionCode?: string;
  type?: PaymentHistoryTransactionType;
  provider: PaymentHistoryProvider;
  status: PaymentHistoryStatus;
  amount: number;
  items: PaymentOrderItem[];
  gatewayTransactionNo?: string | null;
  gatewayPayload?: unknown;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: PaymentAuditUser;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaymentAuditSummary = {
  totalOrders: number;
  totalAmount: number;
  paidAmount: number;
  paidCount: number;
  pendingCount: number;
  failedCount: number;
  cancelledCount: number;
};

export type PaymentAuditListResponse = {
  ok: true;
  items: PaymentAuditItem[];
  pagination: Pagination;
  summary: PaymentAuditSummary;
};

export type PaymentAuditDetailResponse = {
  ok: true;
  item: PaymentAuditItem | null;
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

function normalizeSummary(value: unknown): PaymentAuditSummary {
  const summary = isRecord(value) ? value : {};
  const readNumber = (key: keyof PaymentAuditSummary) => {
    const parsed = Number(summary[key] || 0);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  return {
    totalOrders: readNumber("totalOrders"),
    totalAmount: readNumber("totalAmount"),
    paidAmount: readNumber("paidAmount"),
    paidCount: readNumber("paidCount"),
    pendingCount: readNumber("pendingCount"),
    failedCount: readNumber("failedCount"),
    cancelledCount: readNumber("cancelledCount"),
  };
}

function normalizeListResponse(raw: unknown): PaymentAuditListResponse {
  const payload = unwrapPayload(raw);

  return {
    ok: true,
    items: Array.isArray(payload.items)
      ? (payload.items as PaymentAuditItem[])
      : [],
    pagination: normalizePagination(payload.pagination),
    summary: normalizeSummary(payload.summary),
  };
}

function normalizeDetailResponse(raw: unknown): PaymentAuditDetailResponse {
  const payload = unwrapPayload(raw);

  return {
    ok: true,
    item: isRecord(payload.item) ? (payload.item as PaymentAuditItem) : null,
  };
}

export const paymentAuditApi = {
  async getMine(params?: {
    page?: number;
    limit?: number;
    paymentCode?: string | number;
    status?: PaymentHistoryStatus;
    provider?: PaymentHistoryProvider;
    keyword?: string;
    fromDate?: string;
    toDate?: string;
    sortBy?: PaymentHistorySortKey;
    sortOrder?: PaymentHistorySortOrder;
  }) {
    const { data } = await http.get("/api/payments/audits/me", { params });
    return normalizeListResponse(data);
  },

  async getMyTimeline(paymentCode: string | number) {
    const { data } = await http.get(`/api/payments/audits/me/${paymentCode}`);
    return normalizeDetailResponse(data);
  },

  async getAdminList(params?: {
    page?: number;
    limit?: number;
    paymentCode?: string | number;
    userId?: string;
    provider?: PaymentHistoryProvider;
    status?: PaymentHistoryStatus;
    keyword?: string;
    userKeyword?: string;
    fromDate?: string;
    toDate?: string;
    sortBy?: PaymentHistorySortKey;
    sortOrder?: PaymentHistorySortOrder;
  }) {
    const { data } = await http.get("/api/payments/audits/admin", { params });
    return normalizeListResponse(data);
  },

  async getAdminTimeline(paymentCode: string | number) {
    const { data } = await http.get(`/api/payments/audits/admin/${paymentCode}`);
    return normalizeDetailResponse(data);
  },
};
