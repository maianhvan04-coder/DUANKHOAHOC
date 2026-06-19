import { http } from "@/lib/utils/http";
import type { CategoryItem } from "./category.api";
import {
  type PaginationMeta,
  type SortDirection,
} from "@/lib/utils/admin-list";

export type ProductMode = "ONLINE" | "OFFLINE";
export type ProductLevel = "Cơ bản" | "Trung cấp" | "Nâng cao";
export type ProductStatus = "OPEN" | "COMING" | "FULL";

export type ProductItem = {
  _id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  image?: string;
  imagePublicId?: string;
  category: string | CategoryItem;
  level: ProductLevel;
  modes: ProductMode[];
  status: ProductStatus;
  studentCount: number;
  durationText?: string;
  price: number;
  isActive?: boolean;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type GetProductsQuery = {
  categoryId?: string;
  limit?: string | number;
  page?: string | number;
  q?: string;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: SortDirection;
};

export type ProductListResponse = {
  items: ProductItem[];
  pagination?: PaginationMeta;
};

export type CreateProductBody = {
  title: string;
  shortDescription?: string;
  category: string;
  level?: ProductLevel;
  status?: ProductStatus;
  studentCount?: string;
  durationText?: string;
  price: string;
  isActive?: boolean | "true" | "false";
  modes?: ProductMode | ProductMode[];
  image?: File | null;
  imageUrl?: string;
};

export type UpdateProductBody = {
  title?: string;
  shortDescription?: string;
  category?: string;
  level?: ProductLevel;
  status?: ProductStatus;
  studentCount?: string;
  durationText?: string;
  price?: string;
  isActive?: boolean | "true" | "false";
  modes?: ProductMode | ProductMode[];
  image?: File | null;
  imageUrl?: string;
};

function buildProductFormData(body: CreateProductBody | UpdateProductBody) {
  const formData = new FormData();

  Object.entries(body).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (key === "image") {
      if (value instanceof File) {
        formData.append("image", value, value.name);
      }
      return;
    }

    if (key === "modes") {
      if (Array.isArray(value)) {
        value.forEach((mode) => {
          formData.append("modes", String(mode));
        });
      } else {
        formData.append("modes", String(value));
      }
      return;
    }

    formData.append(key, String(value));
  });

  return formData;
}

export const productApi = {
  getAll: async (query?: GetProductsQuery) => {
    return (
      await http.get<ProductListResponse>("/api/products", {
        params: query,
      })
    ).data;
  },

  getDeleted: async (query?: GetProductsQuery) => {
    return (
      await http.get<ProductListResponse>("/api/products/deleted", {
        params: query,
      })
    ).data;
  },

  getById: async (id: string) => {
    return (await http.get<{ item: ProductItem }>(`/api/products/${id}`)).data;
  },

  create: async (body: CreateProductBody) => {
    const formData = buildProductFormData(body);
    return (await http.post<{ item: ProductItem }>("/api/products", formData)).data;
  },

  update: async (id: string, body: UpdateProductBody) => {
    const formData = buildProductFormData(body);
    return (await http.put<{ item: ProductItem }>(`/api/products/${id}`, formData)).data;
  },

  remove: async (id: string) => {
    return (await http.delete<{ message: string }>(`/api/products/${id}`)).data;
  },

  restore: async (id: string) => {
    return (
      await http.patch<{ message: string; item: ProductItem }>(
        `/api/products/${id}/restore`
      )
    ).data;
  },

  forceRemove: async (id: string) => {
    return (await http.delete<{ message: string }>(`/api/products/${id}/force`)).data;
  },
};
