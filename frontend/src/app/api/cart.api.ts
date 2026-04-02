import { http } from "@/lib/utils/http";

export type CartCourse = {
  _id: string;
  title?: string;
  slug?: string;
  image?: string;
  price?: number;
  originalPrice?: number;
  status?: string;
  isActive?: boolean;
};

export type CartItem = {
  courseId: string;
  title: string;
  image: string;
  quantity: number;
  selected: boolean;
  unitPrice: number;
  originalPrice: number;
  subtotal: number;
  originalSubtotal: number;
  discountSubtotal: number;
  isAvailable: boolean;
  course: CartCourse | null;
};

export type CartSummary = {
  totalItems: number;
  selectedCount: number;
  totalPrice: number;
  totalOriginalPrice: number;
  totalDiscount: number;
};

export type CartData = {
  _id: string;
  user: string;
  items: CartItem[];
  summary: CartSummary;
  createdAt?: string;
  updatedAt?: string;
};

export type CartResponse = {
  message: string;
  data: CartData;
};

export const cartApi = {
  async getMyCart() {
    const res = await http.get<CartResponse>("/api/cart");
    return res.data;
  },

  async addItem(payload: { courseId: string; quantity?: number }) {
    const res = await http.post<CartResponse>("/api/cart/items", payload);
    return res.data;
  },

  async updateItemQuantity(courseId: string, payload: { quantity: number }) {
    const res = await http.patch<CartResponse>(
      `/api/cart/items/${courseId}`,
      payload
    );
    return res.data;
  },

  async toggleItemSelected(courseId: string, payload: { selected: boolean }) {
    const res = await http.patch<CartResponse>(
      `/api/cart/items/${courseId}/select`,
      payload
    );
    return res.data;
  },

  async selectAll(payload: { selected: boolean }) {
    const res = await http.patch<CartResponse>("/api/cart/select-all", payload);
    return res.data;
  },

  async removeItem(courseId: string) {
    const res = await http.delete<CartResponse>(`/api/cart/items/${courseId}`);
    return res.data;
  },

  async clearCart() {
    const res = await http.delete<CartResponse>("/api/cart");
    return res.data;
  },
};