import { http } from "@/lib/utils/http";

export type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

export type NotificationReadStatus = boolean | "true" | "false";
export type NotificationSentStatus = boolean | "true" | "false";

export type NotificationUserItem = {
  _id: string;
  name?: string;
  email?: string;
};

export type NotificationMetadata = Record<string, unknown>;

export type NotificationRecipientItem = {
  _id: string;
  name: string;
  email: string;
  role?: string;
  active?: boolean;
};

export type NotificationItem = {
  _id: string;
  userId: string | NotificationUserItem;
  title: string;
  message: string;
  type: NotificationType;
  actionUrl?: string | null;
  actionLabel?: string | null;
  metadata?: NotificationMetadata | null;
  isSent?: boolean;
  sentAt?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdBy?: string | NotificationUserItem | null;
  createdAt?: string;
  updatedAt?: string;
};

export type NotificationPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type GetNotificationsQuery = {
  userId?: string;
  keyword?: string;
  isSent?: NotificationSentStatus;
  isRead?: NotificationReadStatus;
  type?: NotificationType;
  sortBy?:
    | "createdAt"
    | "title"
    | "type"
    | "isSent"
    | "sentAt"
    | "isRead"
    | "readAt";
  sortOrder?: "asc" | "desc";
  page?: string | number;
  limit?: string | number;
};

export type CreateNotificationBody = {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
};

export type UpdateNotificationBody = {
  title?: string;
  message?: string;
  type?: NotificationType;
};

export type NotificationListData = {
  items: NotificationItem[];
  pagination: NotificationPagination;
};

export type NotificationRecipientsData = {
  items: NotificationRecipientItem[];
};

export type MyNotificationListData = {
  items: NotificationItem[];
  unreadCount: number;
  pagination: NotificationPagination;
};

export type ApiResponse<T> = {
  ok: boolean;
  message?: string;
  data: T;
};

export type ApiMessageResponse = {
  ok: boolean;
  message: string;
};

export const adminNotificationApi = {
  getRecipients: async (query?: { keyword?: string; limit?: string | number }) => {
    return (
      await http.get<ApiResponse<NotificationRecipientsData>>(
        "/api/admin/notifications/recipients",
        {
          params: query,
        }
      )
    ).data;
  },

  getAll: async (query?: GetNotificationsQuery) => {
    return (
      await http.get<ApiResponse<NotificationListData>>(
        "/api/admin/notifications",
        {
          params: query,
        }
      )
    ).data;
  },

  create: async (body: CreateNotificationBody) => {
    return (
      await http.post<ApiResponse<NotificationItem>>(
        "/api/admin/notifications",
        body
      )
    ).data;
  },

  update: async (id: string, body: UpdateNotificationBody) => {
    return (
      await http.patch<ApiResponse<NotificationItem>>(
        `/api/admin/notifications/${id}`,
        body
      )
    ).data;
  },

  send: async (id: string) => {
    return (
      await http.patch<ApiResponse<NotificationItem>>(
        `/api/admin/notifications/${id}/send`
      )
    ).data;
  },

  remove: async (id: string) => {
    return (
      await http.delete<ApiResponse<NotificationItem>>(
        `/api/admin/notifications/${id}`
      )
    ).data;
  },
};

export const notificationApi = {
  getMine: async (query?: Omit<GetNotificationsQuery, "userId">) => {
    return (
      await http.get<ApiResponse<MyNotificationListData>>(
        "/api/web/notifications/me",
        {
          params: query,
        }
      )
    ).data;
  },

  markAsRead: async (id: string) => {
    return (
      await http.patch<ApiResponse<NotificationItem>>(
        `/api/web/notifications/${id}/read`
      )
    ).data;
  },

  markAllAsRead: async () => {
    return (
      await http.patch<ApiMessageResponse>("/api/web/notifications/read-all")
    ).data;
  },
};
