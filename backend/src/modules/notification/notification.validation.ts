import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "ID khong hop le");

const notificationTypeSchema = z.enum(["INFO", "SUCCESS", "WARNING", "ERROR"]);
const notificationSortBySchema = z.enum([
  "createdAt",
  "title",
  "type",
  "isSent",
  "sentAt",
  "isRead",
  "readAt",
]);
const notificationSortOrderSchema = z.enum(["asc", "desc"]);

const booleanLikeSchema = z.union([z.boolean(), z.enum(["true", "false"])]);

export const createNotificationSchema = z.object({
  body: z.object({
    userId: objectId,
    title: z.string().trim().min(1, "Tieu de thong bao la bat buoc"),
    message: z.string().trim().min(1, "Noi dung thong bao la bat buoc"),
    type: notificationTypeSchema.optional(),
  }),
});

export const updateNotificationSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z
    .object({
      title: z.string().trim().min(1, "Tieu de thong bao la bat buoc").optional(),
      message: z
        .string()
        .trim()
        .min(1, "Noi dung thong bao la bat buoc")
        .optional(),
      type: notificationTypeSchema.optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "Du lieu cap nhat khong duoc de trong",
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
    keyword: z.string().trim().min(1).optional(),
    isSent: booleanLikeSchema.optional(),
    isRead: booleanLikeSchema.optional(),
    type: notificationTypeSchema.optional(),
    sortBy: notificationSortBySchema.optional(),
    sortOrder: notificationSortOrderSchema.optional(),
    page: z.string().regex(/^\d+$/, "Page phai la so").optional(),
    limit: z.string().regex(/^\d+$/, "Limit phai la so").optional(),
  }),
});
