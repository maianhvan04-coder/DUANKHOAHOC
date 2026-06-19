import { http } from "@/lib/utils/http";

export type CheckoutItemPayload = {
  courseId: string;
  title: string;
  quantity?: number;
  unitPrice: number;
};

export const paymentApi = {
  createSession(items: CheckoutItemPayload[]) {
    return http.post("/api/payments/checkout/create-session", {
      provider: "vnpay",
      items,
    });
  },

  getOrder(paymentCode: string | number) {
    return http.get(`/api/payments/orders/${paymentCode}`);
  },
};
