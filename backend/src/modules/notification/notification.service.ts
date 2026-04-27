import { Types, type SortOrder } from "mongoose";
import { UserModel } from "../user/user.model";
import {
  NotificationModel,
  type NotificationType,
} from "./notification.model";

type HttpError = Error & {
  statusCode?: number;
};

function createHttpError(message: string, statusCode: number): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
}

export type CreateNotificationPayload = {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  createdBy?: string | null;
};

export type NotificationListQuery = {
  userId?: string;
  keyword?: string;
  isRead?: boolean | "true" | "false";
  type?: NotificationType;
  sortBy?: "createdAt" | "title" | "type" | "isRead" | "readAt";
  sortOrder?: "asc" | "desc";
  page?: string;
  limit?: string;
};

export type NotificationRecipientQuery = {
  keyword?: string;
  limit?: string;
};

function parseBooleanLike(value?: boolean | "true" | "false") {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function parsePositiveNumber(value: string | undefined, defaultValue: number) {
  if (!value) return defaultValue;

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return defaultValue;
  }

  return numberValue;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildNotificationSort(
  query: NotificationListQuery
): Record<string, SortOrder> {
  const direction: SortOrder = query.sortOrder === "asc" ? 1 : -1;
  const sort: Record<string, SortOrder> = { createdAt: direction };

  switch (query.sortBy) {
    case "title":
      sort.title = direction;
      sort.createdAt = -1;
      return sort;
    case "type":
      sort.type = direction;
      sort.createdAt = -1;
      return sort;
    case "isRead":
      sort.isRead = direction;
      sort.createdAt = -1;
      return sort;
    case "readAt":
      sort.readAt = direction;
      sort.createdAt = -1;
      return sort;
    case "createdAt":
    default:
      return sort;
  }
}

async function findMatchingUserIds(keyword?: string) {
  const normalized = keyword?.trim();

  if (!normalized) {
    return [];
  }

  const pattern = new RegExp(escapeRegExp(normalized), "i");

  const users = await UserModel.find({
    deletedAt: null,
    $or: [{ name: pattern }, { email: pattern }],
  })
    .select("_id")
    .limit(100)
    .lean();

  return users.map((user) => user._id);
}

async function buildAdminKeywordFilter(keyword?: string) {
  const normalized = keyword?.trim();

  if (!normalized) {
    return undefined;
  }

  const pattern = new RegExp(escapeRegExp(normalized), "i");
  const userIds = await findMatchingUserIds(normalized);

  return {
    $or: [
      { title: pattern },
      { message: pattern },
      ...(userIds.length > 0 ? [{ userId: { $in: userIds } }] : []),
    ],
  };
}

function buildUserKeywordFilter(keyword?: string) {
  const normalized = keyword?.trim();

  if (!normalized) {
    return undefined;
  }

  const pattern = new RegExp(escapeRegExp(normalized), "i");

  return {
    $or: [{ title: pattern }, { message: pattern }],
  };
}

export async function createNotification(payload: CreateNotificationPayload) {
  if (!Types.ObjectId.isValid(payload.userId)) {
    throw createHttpError("User không hợp lệ", 400);
  }

  const notification = await NotificationModel.create({
    userId: new Types.ObjectId(payload.userId),
    title: payload.title,
    message: payload.message,
    type: payload.type ?? "INFO",
    createdBy:
      payload.createdBy && Types.ObjectId.isValid(payload.createdBy)
        ? new Types.ObjectId(payload.createdBy)
        : null,
  });

  return notification;
}

export async function getAdminNotifications(query: NotificationListQuery) {
  const page = parsePositiveNumber(query.page, 1);
  const limit = parsePositiveNumber(query.limit, 20);
  const skip = (page - 1) * limit;
  const sort = buildNotificationSort(query);

  const filter: Record<string, unknown> = {};

  if (query.userId) {
    if (!Types.ObjectId.isValid(query.userId)) {
      throw createHttpError("User không hợp lệ", 400);
    }

    filter.userId = new Types.ObjectId(query.userId);
  }

  const isRead = parseBooleanLike(query.isRead);
  if (typeof isRead === "boolean") {
    filter.isRead = isRead;
  }

  if (query.type) {
    filter.type = query.type;
  }

  const keywordFilter = await buildAdminKeywordFilter(query.keyword);
  if (keywordFilter) {
    Object.assign(filter, keywordFilter);
  }

  const [items, total] = await Promise.all([
    NotificationModel.find(filter)
      .populate("userId", "email name")
      .populate("createdBy", "email name")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),

    NotificationModel.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getUserNotifications(
  userId: string,
  query: NotificationListQuery
) {
  if (!Types.ObjectId.isValid(userId)) {
    throw createHttpError("User không hợp lệ", 400);
  }

  const page = parsePositiveNumber(query.page, 1);
  const limit = parsePositiveNumber(query.limit, 20);
  const skip = (page - 1) * limit;
  const sort = buildNotificationSort(query);

  const filter: Record<string, unknown> = {
    userId: new Types.ObjectId(userId),
  };

  const isRead = parseBooleanLike(query.isRead);
  if (typeof isRead === "boolean") {
    filter.isRead = isRead;
  }

  if (query.type) {
    filter.type = query.type;
  }

  const keywordFilter = buildUserKeywordFilter(query.keyword);
  if (keywordFilter) {
    Object.assign(filter, keywordFilter);
  }

  const [items, total, unreadCount] = await Promise.all([
    NotificationModel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),

    NotificationModel.countDocuments(filter),

    NotificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
    }),
  ]);

  return {
    items,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string
) {
  if (
    !Types.ObjectId.isValid(notificationId) ||
    !Types.ObjectId.isValid(userId)
  ) {
    throw createHttpError("Thông báo không hợp lệ", 400);
  }

  const notification = await NotificationModel.findOneAndUpdate(
    {
      _id: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(userId),
    },
    {
      isRead: true,
      readAt: new Date(),
    },
    {
      new: true,
    }
  ).lean();

  if (!notification) {
    throw createHttpError("Không tìm thấy thông báo", 404);
  }

  return notification;
}

export async function markAllNotificationsAsRead(userId: string) {
  if (!Types.ObjectId.isValid(userId)) {
    throw createHttpError("User không hợp lệ", 400);
  }

  await NotificationModel.updateMany(
    {
      userId: new Types.ObjectId(userId),
      isRead: false,
    },
    {
      isRead: true,
      readAt: new Date(),
    }
  );

  return true;
}

export async function deleteAdminNotification(notificationId: string) {
  if (!Types.ObjectId.isValid(notificationId)) {
    throw createHttpError("Thông báo không hợp lệ", 400);
  }

  const deleted = await NotificationModel.findByIdAndDelete(notificationId);

  if (!deleted) {
    throw createHttpError("Không tìm thấy thông báo", 404);
  }

  return deleted;
}

export async function getNotificationRecipients(
  query: NotificationRecipientQuery
) {
  const limit = Math.min(parsePositiveNumber(query.limit, 200), 500);
  const keyword = query.keyword?.trim();

  const filter: {
    active: boolean;
    deletedAt: null;
    $or?: Array<Record<string, RegExp>>;
  } = {
    active: true,
    deletedAt: null,
  };

  if (keyword) {
    const pattern = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: pattern }, { email: pattern }, { role: pattern }];
  }

  const items = await UserModel.find(filter)
    .select("_id name email role active")
    .sort({ name: 1, email: 1 })
    .limit(limit)
    .lean();

  return { items };
}
