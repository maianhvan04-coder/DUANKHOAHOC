import { http } from "@/lib/utils/http";
import {
  type PaginationMeta,
  readPaginationMeta,
} from "@/lib/utils/admin-list";

export type BlogItem = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  category: string;
  tags?: string[];
  image?: string;
  imagePublicId?: string;
  authorName?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  publishedAt?: string | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type BlogCategoryItem = {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type BlogListQuery = {
  category?: string;
  featured?: boolean | string;
  isFeatured?: boolean | string;
  isPublished?: boolean | string;
  keyword?: string;
  limit?: number | string;
  page?: number | string;
  published?: boolean | string;
  q?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type BlogListResponse = {
  items: BlogItem[];
  pagination: PaginationMeta;
};

export type BlogBody = {
  title: string;
  excerpt?: string;
  content: string;
  category: string;
  tags?: string[] | string;
  authorName?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  publishedAt?: string;
  image?: File | null;
};

export type UpdateBlogBody = Partial<BlogBody>;

export type BlogCategoryBody = {
  name: string;
  description?: string;
  isActive?: boolean;
};

function normalizeListResponse(
  raw: { items?: BlogItem[]; pagination?: PaginationMeta },
  query?: BlogListQuery
): BlogListResponse {
  const items = raw.items || [];
  return {
    items,
    pagination: readPaginationMeta(
      raw,
      items.length,
      Number(query?.page || 1),
      Number(query?.limit || Math.max(items.length, 1))
    ),
  };
}

function buildBlogFormData(body: BlogBody | UpdateBlogBody) {
  const formData = new FormData();

  Object.entries(body).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (key === "image") {
      if (value instanceof File) {
        formData.append("image", value, value.name);
      }
      return;
    }

    if (key === "tags") {
      if (Array.isArray(value)) {
        value.forEach((tag) => {
          if (tag.trim()) formData.append("tags", tag.trim());
        });
      } else {
        formData.append("tags", String(value));
      }
      return;
    }

    formData.append(key, String(value));
  });

  return formData;
}

export const blogApi = {
  getCategories: async () => {
    return (
      await http.get<{ items: BlogCategoryItem[] }>("/api/blogs/categories")
    ).data;
  },

  getCategoriesAdmin: async () => {
    return (
      await http.get<{ items: BlogCategoryItem[] }>(
        "/api/blogs/categories/admin"
      )
    ).data;
  },

  createCategory: async (body: BlogCategoryBody) => {
    return (
      await http.post<{ item: BlogCategoryItem }>("/api/blogs/categories", body)
    ).data;
  },

  updateCategory: async (id: string, body: Partial<BlogCategoryBody>) => {
    return (
      await http.put<{ item: BlogCategoryItem }>(
        `/api/blogs/categories/${id}`,
        body
      )
    ).data;
  },

  removeCategory: async (id: string) => {
    return (
      await http.delete<{ message: string }>(`/api/blogs/categories/${id}`)
    ).data;
  },

  restoreCategory: async (id: string) => {
    return (
      await http.patch<{ message: string; item: BlogCategoryItem }>(
        `/api/blogs/categories/${id}/restore`
      )
    ).data;
  },

  forceRemoveCategory: async (id: string) => {
    return (
      await http.delete<{ message: string }>(
        `/api/blogs/categories/${id}/force`
      )
    ).data;
  },

  getAll: async (query?: BlogListQuery) => {
    const res = await http.get<{ items: BlogItem[]; pagination?: PaginationMeta }>(
      "/api/blogs",
      { params: query }
    );
    return normalizeListResponse(res.data, query);
  },

  getAdminAll: async (query?: BlogListQuery) => {
    const res = await http.get<{ items: BlogItem[]; pagination?: PaginationMeta }>(
      "/api/blogs/admin",
      { params: query }
    );
    return normalizeListResponse(res.data, query);
  },

  getDeleted: async (query?: BlogListQuery) => {
    const res = await http.get<{ items: BlogItem[]; pagination?: PaginationMeta }>(
      "/api/blogs/deleted",
      { params: query }
    );
    return normalizeListResponse(res.data, query);
  },

  getById: async (idOrSlug: string) => {
    return (await http.get<{ item: BlogItem }>(`/api/blogs/${idOrSlug}`)).data;
  },

  create: async (body: BlogBody) => {
    return (
      await http.post<{ item: BlogItem }>("/api/blogs", buildBlogFormData(body))
    ).data;
  },

  update: async (id: string, body: UpdateBlogBody) => {
    return (
      await http.put<{ item: BlogItem }>(
        `/api/blogs/${id}`,
        buildBlogFormData(body)
      )
    ).data;
  },

  remove: async (id: string) => {
    return (await http.delete<{ message: string }>(`/api/blogs/${id}`)).data;
  },

  restore: async (id: string) => {
    return (
      await http.patch<{ message: string; item: BlogItem }>(
        `/api/blogs/${id}/restore`
      )
    ).data;
  },

  forceRemove: async (id: string) => {
    return (
      await http.delete<{ message: string }>(`/api/blogs/${id}/force`)
    ).data;
  },
};
