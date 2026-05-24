import { http } from "@/lib/utils/http";
import type { ProductMode } from "./course.api";

export type WalletTransaction = {
  _id: string;
  type: "TOPUP" | "ENROLL" | "REFUND";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
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
};
