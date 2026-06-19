import { http } from "@/lib/utils/http";
import type { ProductMode } from "./course.api";

export type WalletTransaction = {
  _id: string;
  type: "TOPUP" | "ENROLL" | "REFUND" | "ADMIN_DEBIT";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  paymentMethod?: unknown;
  transactionCode?: string;
  currency?: string;
  note?: string;
  createdAt?: string;
};

export type WalletResponse = {
  balance: number;
  transactions?: WalletTransaction[];
};

export type WalletEnrollResponse = {
  message: string;
  balance: number;
  item?: unknown;
};

export type WalletHistoryUser = {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
} | null;

export type WalletHistoryPaymentMethod = {
  _id: string;
  name?: string;
  code?: string;
  type?: "BANK" | "EWALLET" | "CRYPTO";
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
} | null;

export type AdminWalletHistoryItem = {
  _id: string;
  type: WalletTransaction["type"];
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  user?: WalletHistoryUser;
  actor?: WalletHistoryUser;
  paymentMethod?: WalletHistoryPaymentMethod;
  transactionCode?: string;
  currency?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type WalletHistorySortKey =
  | "createdAt"
  | "amount"
  | "balanceBefore"
  | "balanceAfter"
  | "type";

export type AdminWalletHistoryParams = {
  page?: number;
  limit?: number;
  keyword?: string;
  reference?: string;
  type?: WalletTransaction["type"];
  fromDate?: string;
  toDate?: string;
  sortBy?: WalletHistorySortKey;
  sortOrder?: "asc" | "desc";
};

export type AdminWalletHistoryResponse = {
  ok?: boolean;
  items: AdminWalletHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const walletApi = {
  async getMine() {
    const res = await http.get<WalletResponse>("/api/wallet/me");
    return res.data;
  },

  async topup(payload: { amount: number }) {
    const res = await http.post<WalletResponse & { message: string }>(
      "/api/wallet/topup",
      payload
    );
    return res.data;
  },

  async enroll(payload: { courseId: string; mode: ProductMode }) {
    const res = await http.post<WalletEnrollResponse>(
      "/api/wallet/enroll",
      payload
    );
    return res.data;
  },

  async getAdminBalanceHistory(params?: AdminWalletHistoryParams) {
    const res = await http.get<AdminWalletHistoryResponse>(
      "/api/wallet/admin/balance-history",
      { params }
    );
    return res.data;
  },

  async getAdminBankHistory(params?: AdminWalletHistoryParams) {
    const res = await http.get<AdminWalletHistoryResponse>(
      "/api/wallet/admin/bank-history",
      { params }
    );
    return res.data;
  },
};
