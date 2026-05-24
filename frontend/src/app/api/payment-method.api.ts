import { http } from "@/lib/utils/http";

export type PaymentMethodType = "BANK" | "EWALLET" | "CRYPTO";

export type PaymentMethodItem = {
  _id: string;
  name: string;
  code: string;
  type: PaymentMethodType;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  logo?: string;
  qrImage?: string;
  description?: string;
  transferPrefix?: string;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type PaymentMethodPayload = {
  name: string;
  code: string;
  type: PaymentMethodType;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  logo?: string;
  qrImage?: string;
  description?: string;
  transferPrefix?: string;
  sortOrder?: number;
  isActive?: boolean;
};

type PaymentMethodListResponse = {
  items: PaymentMethodItem[];
};

type PaymentMethodSingleResponse = {
  item: PaymentMethodItem;
  message?: string;
};

export const paymentMethodApi = {
  async getActive() {
    const res = await http.get<PaymentMethodListResponse>("/api/payment-methods");
    return res.data;
  },

  async getAdminList() {
    const res = await http.get<PaymentMethodListResponse>(
      "/api/payment-methods/admin"
    );
    return res.data;
  },

  async create(payload: PaymentMethodPayload) {
    const res = await http.post<PaymentMethodSingleResponse>(
      "/api/payment-methods/admin",
      payload
    );
    return res.data;
  },

  async update(id: string, payload: Partial<PaymentMethodPayload>) {
    const res = await http.put<PaymentMethodSingleResponse>(
      `/api/payment-methods/admin/${id}`,
      payload
    );
    return res.data;
  },

  async remove(id: string) {
    const res = await http.delete<PaymentMethodSingleResponse>(
      `/api/payment-methods/admin/${id}`
    );
    return res.data;
  },
};
