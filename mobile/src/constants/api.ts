import { Platform } from "react-native";

export const API_BASE_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:8080"
    : "http://localhost:8080";

export const API_ENDPOINTS = {
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
    me: "/api/auth/me",
    refresh: "/api/auth/refresh",
    logout: "/api/auth/logout",
  },
  account: {
    me: "/api/account/me",
    password: "/api/account/me/password",
  },
  notifications: {
    mine: "/api/web/notifications/me",
    markAsRead: (id: string) => `/api/web/notifications/${id}/read`,
    markAllAsRead: "/api/web/notifications/read-all",
  },
  students: {
    studies: (studentId: string) => `/api/students/${studentId}/studies`,
  },
  blogs: {
    list: "/api/blogs",
    detail: (idOrSlug: string) => `/api/blogs/${idOrSlug}`,
  },
  courses: "/api/products",
};
