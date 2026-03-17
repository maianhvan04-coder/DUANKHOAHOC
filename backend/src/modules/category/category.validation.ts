import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "ID không hợp lệ");

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Tên danh mục là bắt buộc"),
    description: z.string().optional().default(""),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z
    .object({
      name: z.string().trim().min(1, "Tên danh mục không được rỗng").optional(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Không có dữ liệu cập nhật",
      path: ["body"],
    }),
});

export const categoryIdSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});