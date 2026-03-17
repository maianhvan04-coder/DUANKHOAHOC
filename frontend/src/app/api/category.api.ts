import { http } from "@/lib/utils/http";

export type CategoryItem = {
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

export type CreateCategoryBody = {
  name: string;
  description?: string;
};

export type UpdateCategoryBody = {
  name?: string;
  description?: string;
  isActive?: boolean;
};

export const categoryApi = {
  getAll: async () => {
    return (await http.get<{ items: CategoryItem[] }>("/api/categories")).data;
  },

  getDeleted: async () => {
    return (
      await http.get<{ items: CategoryItem[] }>("/api/categories/deleted")
    ).data;
  },

  create: async (body: CreateCategoryBody) => {
    return (await http.post<{ item: CategoryItem }>("/api/categories", body)).data;
  },

  update: async (id: string, body: UpdateCategoryBody) => {
    return (
      await http.put<{ item: CategoryItem }>(`/api/categories/${id}`, body)
    ).data;
  },

  remove: async (id: string) => {
    return (
      await http.delete<{ message: string }>(`/api/categories/${id}`)
    ).data;
  },

  restore: async (id: string) => {
    return (
      await http.patch<{ message: string; item: CategoryItem }>(
        `/api/categories/${id}/restore`
      )
    ).data;
  },

  forceRemove: async (id: string) => {
    return (
      await http.delete<{ message: string }>(`/api/categories/${id}/force`)
    ).data;
  },
};