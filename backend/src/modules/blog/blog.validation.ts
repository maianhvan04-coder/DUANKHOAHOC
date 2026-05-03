import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "ID bài viết không hợp lệ");
const booleanLikeSchema = z.union([z.boolean(), z.enum(["true", "false"])]);
const tagsSchema = z.union([z.string(), z.array(z.string())]).optional();

const sortBySchema = z.enum([
  "title",
  "category",
  "isPublished",
  "isFeatured",
  "publishedAt",
  "createdAt",
  "updatedAt",
  "deletedAt",
]);

const sortOrderSchema = z.enum(["asc", "desc"]);

export const createBlogSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, "Tiêu đề bài viết là bắt buộc"),
    excerpt: z.string().optional(),
    content: z.string().trim().min(1, "Nội dung bài viết là bắt buộc"),
    category: z.string().trim().min(1, "Chuyên mục là bắt buộc"),
    tags: tagsSchema,
    authorName: z.string().optional(),
    isFeatured: booleanLikeSchema.optional(),
    isPublished: booleanLikeSchema.optional(),
    publishedAt: z.string().optional(),
  }),
});

export const updateBlogSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    title: z
      .string()
      .trim()
      .min(1, "Tiêu đề bài viết không được để trống")
      .optional(),
    excerpt: z.string().optional(),
    content: z
      .string()
      .trim()
      .min(1, "Nội dung bài viết không được để trống")
      .optional(),
    category: z
      .string()
      .trim()
      .min(1, "Chuyên mục không được để trống")
      .optional(),
    tags: tagsSchema,
    authorName: z.string().optional(),
    isFeatured: booleanLikeSchema.optional(),
    isPublished: booleanLikeSchema.optional(),
    publishedAt: z.string().optional(),
  }),
});

export const blogIdSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

export const createBlogCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Tên chuyên mục blog là bắt buộc"),
    description: z.string().optional(),
    isActive: booleanLikeSchema.optional(),
  }),
});

export const updateBlogCategorySchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, "Tên chuyên mục blog không được để trống")
      .optional(),
    description: z.string().optional(),
    isActive: booleanLikeSchema.optional(),
  }),
});

export const blogCategoryIdSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

export const blogLookupSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1, "Bài viết không hợp lệ"),
  }),
});

export const getBlogsQuerySchema = z.object({
  query: z.object({
    category: z.string().trim().optional(),
    featured: booleanLikeSchema.optional(),
    isFeatured: booleanLikeSchema.optional(),
    published: booleanLikeSchema.optional(),
    isPublished: booleanLikeSchema.optional(),
    q: z.string().trim().optional(),
    search: z.string().trim().optional(),
    keyword: z.string().trim().optional(),
    page: z.string().regex(/^\d+$/, "Page phải là số").optional(),
    limit: z.string().regex(/^\d+$/, "Limit phải là số").optional(),
    sortBy: sortBySchema.optional(),
    sortOrder: sortOrderSchema.optional(),
  }),
});
