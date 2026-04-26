import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "ID không hợp lệ");

const notificationTypeSchema = z.enum(["INFO", "SUCCESS", "WARNING", "ERROR"]);

const booleanLikeSchema = z.union([z.boolean(), z.enum(["true", "false"])]);

export const createNotificationSchema = z.object({
  body: z.object({
    userId: objectId,
    title: z.string().trim().min(1, "Tiêu đề thông báo là bắt buộc"),
    message: z.string().trim().min(1, "Nội dung thông báo là bắt buộc"),
    type: notificationTypeSchema.optional(),
  }),
});

export const notificationIdSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

export const getNotificationsQuerySchema = z.object({
  query: z.object({
    userId: objectId.optional(),
    isRead: booleanLikeSchema.optional(),
    type: notificationTypeSchema.optional(),
    page: z.string().regex(/^\d+$/, "Page phải là số").optional(),
    limit: z.string().regex(/^\d+$/, "Limit phải là số").optional(),
  }),
});