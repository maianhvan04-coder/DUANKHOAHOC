import type { OrderItemSnapshot } from "../../payment/payment.types";

export type PaymentHistoryProvider = string;
export type PaymentHistoryStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED";
export type PaymentHistorySortKey =
  | "paymentCode"
  | "provider"
  | "amount"
  | "status"
  | "createdAt"
  | "paidAt";
export type PaymentHistorySortOrder = "asc" | "desc";
export type PaymentHistoryTransactionType =
  | "TOPUP"
  | "ENROLL"
  | "REFUND"
  | "ADMIN_DEBIT";

export type PaymentHistoryListQuery = {
  page: number;
  limit: number;
  paymentCode?: number | string;
  provider?: PaymentHistoryProvider;
  status?: PaymentHistoryStatus;
  userId?: string;
  keyword?: string;
  userKeyword?: string;
  fromDate?: Date;
  toDate?: Date;
  sortBy: PaymentHistorySortKey;
  sortOrder: PaymentHistorySortOrder;
};

export type PaymentHistoryUser = {
  _id: string;
  name: string;
  email: string;
} | null;

export type PaymentHistoryItem = {
  _id: string;
  paymentCode: number;
  transactionCode: string;
  type: PaymentHistoryTransactionType;
  provider: PaymentHistoryProvider;
  status: PaymentHistoryStatus;
  amount: number;
  items: OrderItemSnapshot[];
  gatewayTransactionNo?: string | null;
  gatewayPayload?: unknown;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user?: PaymentHistoryUser;
};

export type PaymentHistoryPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaymentHistorySummary = {
  totalOrders: number;
  totalAmount: number;
  paidAmount: number;
  paidCount: number;
  pendingCount: number;
  failedCount: number;
  cancelledCount: number;
};

export type PaymentHistoryListResult = {
  items: PaymentHistoryItem[];
  pagination: PaymentHistoryPagination;
  summary: PaymentHistorySummary;
};
