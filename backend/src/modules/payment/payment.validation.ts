import { z } from "zod";

export const createCheckoutSessionSchema = z.object({
  body: z.object({
    provider: z.literal("vnpay", {
      error: "Chi ho tro phuong thuc thanh toan VNPAY",
    }),
    items: z
      .array(
        z.object({
          courseId: z.string().trim().min(1, "Thieu ma khoa hoc"),
          title: z.string().trim().min(1, "Thieu ten khoa hoc"),
          quantity: z.coerce.number().int().positive().optional(),
          unitPrice: z.coerce.number().min(0, "Gia khong hop le"),
        })
      )
      .min(1, "Chua co khoa hoc de thanh toan"),
  }),
});

export const getOrderStatusSchema = z.object({
  params: z.object({
    paymentCode: z
      .string()
      .trim()
      .regex(/^\d+$/, "paymentCode phai la so"),
  }),
});

export const vnpayCallbackSchema = z.object({
  query: z.object({
    vnp_TxnRef: z
      .string()
      .trim()
      .regex(/^\d+$/, "vnp_TxnRef khong hop le"),
    vnp_ResponseCode: z.string().trim().min(1, "Thieu vnp_ResponseCode"),
    vnp_SecureHash: z.string().trim().min(1, "Thieu vnp_SecureHash"),
    vnp_TransactionStatus: z.string().trim().optional(),
    vnp_TransactionNo: z.string().trim().optional(),
    vnp_Amount: z.string().trim().optional(),
  }),
});
