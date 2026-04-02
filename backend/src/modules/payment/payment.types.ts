export type PaymentProvider = "vnpay";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED";

export type OrderItemSnapshot = {
  courseId: string;
  title: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type CreateCheckoutSessionInput = {
  userId: string;
  provider: PaymentProvider;
  ipAddr?: string;
};