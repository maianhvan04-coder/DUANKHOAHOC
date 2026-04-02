import { z } from "zod";

export const createCheckoutSessionSchema = z.object({
  body: z.object({
    provider: z.literal("vnpay", {
      error: "Chỉ hỗ trợ phương thức thanh toán VNPAY",
    }),
  }),
});

export const getOrderStatusSchema = z.object({
  params: z.object({
    paymentCode: z
      .string()
      .trim()
      .regex(/^\d+$/, "paymentCode phải là số"),
  }),
});

export const vnpayCallbackSchema = z.object({
  query: z.object({
    vnp_TxnRef: z
      .string()
      .trim()
      .regex(/^\d+$/, "vnp_TxnRef không hợp lệ"),
    vnp_ResponseCode: z
      .string()
      .trim()
      .min(1, "Thiếu vnp_ResponseCode"),
    vnp_SecureHash: z
      .string()
      .trim()
      .min(1, "Thiếu vnp_SecureHash"),
    vnp_TransactionStatus: z.string().trim().optional(),
    vnp_TransactionNo: z.string().trim().optional(),
    vnp_Amount: z.string().trim().optional(),
  }),
});