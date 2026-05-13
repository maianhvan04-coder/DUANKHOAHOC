import { z } from "zod";

const emptyToUndefined = <T>(value: T) => {
  if (value === "" || value === null || value === undefined) return undefined;
  return value;
};

const objectIdRegex = /^[a-f\d]{24}$/i;

const providerSchema = z.enum(["vnpay", "payos"]);
const statusSchema = z.enum(["PENDING", "PAID", "FAILED", "CANCELLED"]);

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),

  paymentCode: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().positive().optional()
  ),

  provider: z.preprocess(emptyToUndefined, providerSchema.optional()),

  status: z.preprocess(emptyToUndefined, statusSchema.optional()),

  userId: z.preprocess(
    emptyToUndefined,
    z.string().trim().regex(objectIdRegex, "userId không hợp lệ").optional()
  ),

  keyword: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(100).optional()
  ),

  userKeyword: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(100).optional()
  ),
});

export const getMyPaymentHistorySchema = z.object({
  query: listQuerySchema.omit({ userId: true }),
});

export const getMyPaymentHistoryDetailSchema = z.object({
  params: z.object({
    paymentCode: z.coerce.number().int().positive(),
  }),
});

export const getAdminPaymentHistorySchema = z.object({
  query: listQuerySchema,
});

export const getAdminPaymentHistoryDetailSchema = z.object({
  params: z.object({
    paymentCode: z.coerce.number().int().positive(),
  }),
});
