export type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

export type NotificationItem = {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  readAt?: string | null;
  createdAt?: string;
};

export type NotificationPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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
