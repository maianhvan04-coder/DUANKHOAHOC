import { http } from "@/lib/utils/http";
import type { CategoryItem } from "./category.api";

export type ProductMode = "ONLINE" | "OFFLINE";
export type ProductLevel = "Cơ bản" | "Trung cấp" | "Nâng cao";
export type ProductStatus = "OPEN" | "COMING" | "FULL";

export type ProductItem = {
  _id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  teacherName?: string;
  image?: string;
  imagePublicId?: string;
  category: string | CategoryItem;
  level: ProductLevel;
  modes: ProductMode[];
  status: ProductStatus;
  rating: number;
  studentCount: number;
  durationText?: string;
  price: number;
  originalPrice: number;
  isActive?: boolean;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type GetProductsQuery = {
  categoryId?: string;
  limit?: string | number;
};

export type CreateProductBody = {
  title: string;
  shortDescription?: string;
  teacherName?: string;
  category: string;
  level?: ProductLevel;
  status?: ProductStatus;
  rating?: string;
  studentCount?: string;
  durationText?: string;
  price: string;
  originalPrice?: string;
  isActive?: boolean | "true" | "false";
  modes?: ProductMode | ProductMode[];
  image?: File | null;
};

export type UpdateProductBody = {
  title?: string;
  shortDescription?: string;
  teacherName?: string;
  category?: string;
  level?: ProductLevel;
  status?: ProductStatus;
  rating?: string;
  studentCount?: string;
  durationText?: string;
  price?: string;
  originalPrice?: string;
  isActive?: boolean | "true" | "false";
  modes?: ProductMode | ProductMode[];
  image?: File | null;
};

function buildProductFormData(body: CreateProductBody | UpdateProductBody) {
  const formData = new FormData();

  Object.entries(body).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

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
      await http.get<{ items: ProductItem[] }>("/api/products", {
        params: query,
      })
    ).data;
  },

  getDeleted: async () => {
    return (await http.get<{ items: ProductItem[] }>("/api/products/deleted")).data;
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