import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "ID không hợp lệ");

const modeSchema = z.enum(["ONLINE", "OFFLINE"]);
const levelSchema = z.enum(["Cơ bản", "Trung cấp", "Nâng cao"]);
const statusSchema = z.enum(["OPEN", "COMING", "FULL"]);
const booleanLikeSchema = z.union([z.boolean(), z.enum(["true", "false"])]);

const numberStringSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d+)?$/, "Giá trị phải là số");

const sortBySchema = z.enum([
  "title",
  "category",
  "status",
  "price",
  "studentCount",
  "createdAt",
  "updatedAt",
  "deletedAt",
]);

const sortOrderSchema = z.enum(["asc", "desc"]);

export const createProductSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, "Tên khóa học là bắt buộc"),

    shortDescription: z.string().optional(),

    category: objectId,

    level: levelSchema.optional(),

    status: statusSchema.optional(),

    studentCount: z
      .string()
      .trim()
      .regex(/^\d+$/, "Số học viên phải là số")
      .optional(),

    durationText: z.string().optional(),

    price: numberStringSchema.min(1, "Học phí là bắt buộc"),

    isActive: booleanLikeSchema.optional(),

    modes: z.union([modeSchema, z.array(modeSchema).min(1)]).optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: objectId,
  }),

  body: z.object({
    title: z
      .string()
      .trim()
      .min(1, "Tên khóa học không được để trống")
      .optional(),

    shortDescription: z.string().optional(),

    category: objectId.optional(),

    level: levelSchema.optional(),

    status: statusSchema.optional(),

    studentCount: z
      .string()
      .trim()
      .regex(/^\d+$/, "Số học viên phải là số")
      .optional(),

    durationText: z.string().optional(),

    price: numberStringSchema.optional(),

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
    categoryId: z
      .union([z.literal("all"), z.literal("ALL"), objectId])
      .optional(),

    status: z
      .union([z.literal("all"), z.literal("ALL"), statusSchema])
      .optional(),

    q: z.string().trim().optional(),

    search: z.string().trim().optional(),

    page: z.string().regex(/^\d+$/, "Page phải là số").optional(),

    limit: z.string().regex(/^\d+$/, "Limit phải là số").optional(),

    sortBy: sortBySchema.optional(),

    sortOrder: sortOrderSchema.optional(),
  }),
});
