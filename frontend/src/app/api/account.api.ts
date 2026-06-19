import { http } from "@/lib/utils/http";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED";
export type PaymentProvider = "vnpay" | "payos";

export type AccountUser = {
  _id: string;
  name: string;
  email: string;
  avatar?: string | null;
};

export type PaymentHistoryItem = {
  id: string;
  code: string;
  amount: number;
  status: PaymentStatus;
  provider: PaymentProvider;
  createdAt: string;
};

export type MyCourseStatus = "pending" | "approved" | "assigned";

export type MyCourseItem = {
  id: string;
  source: "study" | "payment" | "wallet";
  courseId: string;
  title: string;
  format: string;
  desiredSchedule: string;
  className: string;
  teacherName: string;
  actualSchedule: string;
  status: MyCourseStatus;
  paymentCode?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const accountApi = {
  async getMe() {
    const { data } = await http.get<{ user: AccountUser }>("/api/account/me");
    return data.user;
  },

  async updateProfile(payload: { name: string; avatar?: File | null }) {
    const formData = new FormData();
    formData.append("name", payload.name);

    if (payload.avatar) {
      formData.append("avatar", payload.avatar);
    }

    const { data } = await http.patch<{
      message: string;
      user: AccountUser;
    }>("/api/account/me/profile", formData);

    return data;
  },

  async changePassword(payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    const { data } = await http.patch<{ message: string }>(
      "/api/account/me/password",
      payload
    );

    return data;
  },

  async getMyPayments() {
    const { data } = await http.get<{ items: PaymentHistoryItem[] }>(
      "/api/account/me/payments"
    );
    return data.items;
  },

  async getMyCourses() {
    const { data } = await http.get<{ items: MyCourseItem[] }>(
      "/api/account/me/courses"
    );
    return data.items;
  },
};
