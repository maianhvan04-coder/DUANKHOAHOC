import { z } from "zod";

const emptyToUndefined = <T>(value: T) => {
  if (value === "" || value === null || value === undefined) return undefined;
  return value;
};

const objectIdRegex = /^[a-f\d]{24}$/i;

const providerSchema = z.string().trim().min(1).max(100);
const statusSchema = z.enum(["PENDING", "PAID", "FAILED", "CANCELLED"]);
const sortBySchema = z.enum([
  "paymentCode",
  "provider",
  "amount",
  "status",
  "createdAt",
  "paidAt",
]);
const sortOrderSchema = z.enum(["asc", "desc"]);

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),

  paymentCode: z.preprocess(
    emptyToUndefined,
    z.string().trim().min(1).optional()
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

  fromDate: z.preprocess(emptyToUndefined, z.coerce.date().optional()),

  toDate: z.preprocess(emptyToUndefined, z.coerce.date().optional()),

  sortBy: z.preprocess(
    emptyToUndefined,
    sortBySchema.default("createdAt")
  ),

  sortOrder: z.preprocess(
    emptyToUndefined,
    sortOrderSchema.default("desc")
  ),
});

export const getMyPaymentHistorySchema = z.object({
  query: listQuerySchema.omit({ userId: true }),
});

export const getMyPaymentHistoryDetailSchema = z.object({
  params: z.object({
    paymentCode: z.string().trim().min(1),
  }),
});

export const getAdminPaymentHistorySchema = z.object({
  query: listQuerySchema,
});

export const getAdminPaymentHistoryDetailSchema = z.object({
  params: z.object({
    paymentCode: z.string().trim().min(1),
  }),
});
