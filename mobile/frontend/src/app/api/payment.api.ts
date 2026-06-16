import { http } from "@/lib/utils/http";

export const paymentApi = {
  createSession() {
    return http.post("/api/payments/checkout/create-session", {
      provider: "vnpay",
    });
  },

  getOrder(paymentCode: string | number) {
    return http.get(`/api/payments/orders/${paymentCode}`);
  },
};