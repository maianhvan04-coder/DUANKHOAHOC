import { API_ENDPOINTS } from "../constants/api";
import type {
  ApiResponse,
  MyNotificationListData,
  NotificationItem,
  NotificationType,
} from "../types/notification.type";
import { httpClient } from "../utils/httpClient";

type AnyObj = Record<string, unknown>;

function isObject(value: unknown): value is AnyObj {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function parseType(value: unknown): NotificationType {
  const raw = asString(value, "INFO");
  if (raw === "SUCCESS" || raw === "WARNING" || raw === "ERROR") return raw;
  return "INFO";
}

function normalizeNotification(raw: unknown): NotificationItem {
  const obj = isObject(raw) ? raw : {};

  return {
    _id: asString(obj._id) || asString(obj.id),
    title: asString(obj.title, "Thông báo"),
    message: asString(obj.message),
    type: parseType(obj.type),
    isRead: asBoolean(obj.isRead, false),
    readAt: typeof obj.readAt === "string" ? obj.readAt : null,
    createdAt: asString(obj.createdAt),
  };
}

export const notificationService = {
  async getMine(query?: { page?: number; limit?: number }) {
    const response = await httpClient.get<ApiResponse<MyNotificationListData>>(
      API_ENDPOINTS.notifications.mine,
      { params: query }
    );

    return {
      ...response.data,
      items: response.data.items.map(normalizeNotification),
    };
  },

  async markAsRead(id: string) {
    return httpClient.patch<ApiResponse<NotificationItem>>(
      API_ENDPOINTS.notifications.markAsRead(id)
    );
  },

  async markAllAsRead() {
    return httpClient.patch<{ ok: boolean; message: string }>(
      API_ENDPOINTS.notifications.markAllAsRead
    );
  },
};
