import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "ID không hợp lệ");

const modeSchema = z.enum(["ONLINE", "OFFLINE"]);
const levelSchema = z.enum(["Cơ bản", "Trung cấp", "Nâng cao"]);
const statusSchema = z.enum(["OPEN", "COMING", "FULL"]);
const booleanLikeSchema = z.union([z.boolean(), z.enum(["true", "false"])]);

export const createProductSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, "Tên khóa học là bắt buộc"),
    shortDescription: z.string().optional(),
    teacher: objectId.optional(),
    category: objectId,
    level: levelSchema.optional(),
    status: statusSchema.optional(),
    rating: z.string().optional(),
    durationText: z.string().optional(),
    price: z.string().trim().min(1, "Học phí là bắt buộc"),
    isActive: booleanLikeSchema.optional(),
    modes: z.union([modeSchema, z.array(modeSchema).min(1)]).optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    title: z.string().trim().min(1, "Tên khóa học không được để trống").optional(),
    shortDescription: z.string().optional(),
    teacher: z.string().trim().optional(),
    category: objectId.optional(),
    level: levelSchema.optional(),
    status: statusSchema.optional(),
    rating: z.string().optional(),
    durationText: z.string().optional(),
    price: z.string().optional(),
    isActive: booleanLikeSchema.optional(),
    modes: z.union([modeSchema, z.array(modeSchema).min(1)]).optional(),
  }),
});

export const productIdSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

export const getProductsQuerySchema = z.object({
  query: z.object({
    categoryId: z.union([z.literal("all"), objectId]).optional(),
    limit: z.string().regex(/^\d+$/, "Limit phải là số").optional(),
  }),
});