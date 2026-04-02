import type { OrderItemSnapshot } from "../../payment/payment.types";

export type PaymentHistoryProvider = "vnpay" | "payos";
export type PaymentHistoryStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED";

export type PaymentHistoryListQuery = {
  page: number;
  limit: number;
  paymentCode?: number;
  provider?: PaymentHistoryProvider;
  status?: PaymentHistoryStatus;
  userId?: string;
  keyword?: string;
};

export type PaymentHistoryUser = {
  _id: string;
  name: string;
  email: string;
} | null;

export type PaymentHistoryItem = {
  _id: string;
  paymentCode: number;
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

export type PaymentHistoryListResult = {
  items: PaymentHistoryItem[];
  pagination: PaymentHistoryPagination;
};