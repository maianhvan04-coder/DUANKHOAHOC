import { http } from "@/lib/utils/http";

export type PaymentAuditAction =
  | "CHECKOUT_CREATED"
  | "RETURN_RECEIVED"
  | "IPN_RECEIVED"
  | "MARK_PAID"
  | "MARK_FAILED"
  | "MARK_CANCELLED"
  | "DUPLICATE_IGNORED"
  | "ADMIN_NOTE";

export type PaymentAuditActorType = "SYSTEM" | "USER" | "ADMIN" | "VNPAY";

export type PaymentAuditItem = {
  _id: string;
  paymentCode: number;
  provider: "vnpay" | "payos";
  action: PaymentAuditAction;
  actorType: PaymentAuditActorType;
  actorName?: string;
  fromStatus: string;
  toStatus: string;
  amount: number;
  currency: string;
  note: string;
  ipAddr: string;
  userAgent: string;
  createdAt: string;
  meta?: Record<string, unknown>;
  user?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  actor?: {
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

export type PaymentAuditListResponse = {
  ok: true;
  items: PaymentAuditItem[];
  pagination: Pagination;
};

export type PaymentAuditTimelineResponse = {
  ok: true;
  items: PaymentAuditItem[];
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function unwrapPayload<T extends UnknownRecord>(raw: unknown): T | UnknownRecord {
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

function normalizeListResponse(raw: unknown): PaymentAuditListResponse {
  const payload = unwrapPayload<UnknownRecord>(raw);

  return {
    ok: true,
    items: Array.isArray(payload.items)
      ? (payload.items as PaymentAuditItem[])
      : [],
    pagination: normalizePagination(payload.pagination),
  };
}

function normalizeTimelineResponse(raw: unknown): PaymentAuditTimelineResponse {
  const payload = unwrapPayload<UnknownRecord>(raw);

  return {
    ok: true,
    items: Array.isArray(payload.items)
      ? (payload.items as PaymentAuditItem[])
      : [],
  };
}

function normalizeAdminNoteResponse(raw: unknown) {
  const payload = unwrapPayload<UnknownRecord>(raw);

  return {
    ok: true as const,
    item: isRecord(payload.item) && typeof payload.item._id === "string"
      ? { _id: payload.item._id }
      : { _id: "" },
  };
}

export const paymentAuditApi = {
  async getMine(params?: {
    page?: number;
    limit?: number;
    paymentCode?: number;
    action?: PaymentAuditAction;
    provider?: "vnpay" | "payos";
  }) {
    const { data } = await http.get("/payments/audits/me", { params });
    return normalizeListResponse(data);
  },

  async getMyTimeline(paymentCode: number) {
    const { data } = await http.get(`/payments/audits/me/${paymentCode}`);
    return normalizeTimelineResponse(data);
  },

  async getAdminList(params?: {
    page?: number;
    limit?: number;
    paymentCode?: number;
    userId?: string;
    provider?: "vnpay" | "payos";
    action?: PaymentAuditAction;
    actorType?: PaymentAuditActorType;
    keyword?: string;
  }) {
    const { data } = await http.get("/api/payments/audits/admin", { params });
    return normalizeListResponse(data);
  },

  async getAdminTimeline(paymentCode: number) {
    const { data } = await http.get(`/api/payments/audits/admin/${paymentCode}`);
    return normalizeTimelineResponse(data);
  },

  async addAdminNote(paymentCode: number, note: string) {
    const { data } = await http.post(
      `/api/payments/audits/admin/${paymentCode}/note`,
      { note }
    );

    return normalizeAdminNoteResponse(data);
  },
};