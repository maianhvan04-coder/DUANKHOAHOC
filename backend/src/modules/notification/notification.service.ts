import { Types, type SortOrder } from "mongoose";
import { ROLES } from "../../constants/roles";
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
  actionUrl?: string | null;
  actionLabel?: string | null;
  metadata?: Record<string, unknown> | null;
  isSent?: boolean;
  createdBy?: string | null;
};

export type UpdateNotificationPayload = {
  title?: string;
  message?: string;
  type?: NotificationType;
};

export type NotificationListQuery = {
  userId?: string;
  keyword?: string;
  isSent?: boolean | "true" | "false";
  isRead?: boolean | "true" | "false";
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
  page?: string;
  limit?: string;
};

export type NotificationRecipientQuery = {
  keyword?: string;
  limit?: string;
};

export type CoursePurchaseNotificationInput = {
  userId: string;
  source: "PAYMENT" | "WALLET";
  amount: number;
  provider?: string | null;
  paymentCode?: number | null;
  transactionCode?: string | null;
  gatewayTransactionNo?: string | null;
  mode?: string | null;
  classRoomId?: string | null;
  studyId?: string | null;
  courses: Array<{
    courseId: string;
    title: string;
    quantity?: number;
    unitPrice?: number;
    subtotal?: number;
  }>;
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
    case "isSent":
      sort.isSent = direction;
      sort.createdAt = -1;
      return sort;
    case "sentAt":
      sort.sentAt = direction;
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

function buildSentFilter(isSent?: boolean) {
  if (isSent === false) {
    return { isSent: false };
  }

  return {
    $or: [{ isSent: true }, { isSent: { $exists: false } }],
  };
}

function combineFilter(
  baseFilter: Record<string, unknown>,
  conditions: Record<string, unknown>[]
) {
  if (conditions.length === 0) {
    return baseFilter;
  }

  if (Object.keys(baseFilter).length === 0) {
    return conditions.length === 1 ? conditions[0] : { $and: conditions };
  }

  return {
    $and: [baseFilter, ...conditions],
  };
}

export async function createNotification(payload: CreateNotificationPayload) {
  if (!Types.ObjectId.isValid(payload.userId)) {
    throw createHttpError("User không hợp lệ", 400);
  }

  const sentAt = payload.isSent ? new Date() : null;

  const notification = await NotificationModel.create({
    userId: new Types.ObjectId(payload.userId),
    title: payload.title,
    message: payload.message,
    type: payload.type ?? "INFO",
    actionUrl: payload.actionUrl ?? null,
    actionLabel: payload.actionLabel ?? null,
    metadata: payload.metadata ?? null,
    isSent: payload.isSent ?? false,
    sentAt,
    isRead: false,
    readAt: null,
    createdBy:
      payload.createdBy && Types.ObjectId.isValid(payload.createdBy)
        ? new Types.ObjectId(payload.createdBy)
        : null,
  });

  return notification;
}

function formatVnd(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(value || 0))} đ`;
}

function buildCourseSummary(courses: CoursePurchaseNotificationInput["courses"]) {
  const titles = courses
    .map((item) => item.title?.trim())
    .filter(Boolean);

  if (titles.length === 0) return "Chưa rõ khóa học";
  if (titles.length === 1) return titles[0];

  return `${titles[0]} và ${titles.length - 1} khóa học khác`;
}

export async function createCoursePurchaseAdminNotifications(
  input: CoursePurchaseNotificationInput
) {
  if (!Types.ObjectId.isValid(input.userId)) return [];

  const [buyer, admins] = await Promise.all([
    UserModel.findById(input.userId).select("_id name email").lean(),
    UserModel.find({
      role: ROLES.ADMIN,
      active: true,
      deletedAt: null,
    })
      .select("_id")
      .lean(),
  ]);

  if (!buyer || admins.length === 0) return [];

  const courses = input.courses.map((item) => ({
    courseId: item.courseId,
    title: item.title,
    quantity: Number(item.quantity || 1),
    unitPrice: Number(item.unitPrice || 0),
    subtotal: Number(item.subtotal || 0),
  }));
  const firstCourseId = courses[0]?.courseId || "";
  const actionUrl = `/admin/students?studentId=${buyer._id.toString()}&assign=1${
    firstCourseId ? `&courseId=${encodeURIComponent(firstCourseId)}` : ""
  }`;
  const title = "Học viên mua khóa học thành công";
  const message = [
    `Học viên: ${buyer.name || "Học viên"}`,
    `Email: ${buyer.email || "-"}`,
    `Khóa học: ${buildCourseSummary(courses)}`,
    `Số tiền: ${formatVnd(input.amount)}`,
    "Bấm xem chi tiết để gán lớp học cho tài khoản này.",
  ].join("\n");
  const now = new Date();

  const docs = admins.map((admin) => ({
    userId: admin._id,
    title,
    message,
    type: "SUCCESS" as NotificationType,
    actionUrl,
    actionLabel: "Gán lớp học",
    metadata: {
      kind: "COURSE_PURCHASE",
      source: input.source,
      buyer: {
        id: buyer._id.toString(),
        name: buyer.name || "",
        email: buyer.email || "",
      },
      courses,
      amount: Number(input.amount || 0),
      provider: input.provider ?? null,
      paymentCode: input.paymentCode ?? null,
      transactionCode: input.transactionCode ?? null,
      gatewayTransactionNo: input.gatewayTransactionNo ?? null,
      mode: input.mode ?? null,
      classRoomId: input.classRoomId ?? null,
      studyId: input.studyId ?? null,
    },
    isSent: true,
    sentAt: now,
    isRead: false,
    readAt: null,
    createdBy: null,
  }));

  return NotificationModel.insertMany(docs);
}

export async function getAdminNotifications(query: NotificationListQuery) {
  const page = parsePositiveNumber(query.page, 1);
  const limit = parsePositiveNumber(query.limit, 20);
  const skip = (page - 1) * limit;
  const sort = buildNotificationSort(query);

  const filter: Record<string, unknown> = {};
  const andConditions: Record<string, unknown>[] = [];

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

  const isSent = parseBooleanLike(query.isSent);
  if (typeof isSent === "boolean") {
    andConditions.push(buildSentFilter(isSent));
  }

  if (query.type) {
    filter.type = query.type;
  }

  const keywordFilter = await buildAdminKeywordFilter(query.keyword);
  if (keywordFilter) {
    andConditions.push(keywordFilter);
  }

  const finalFilter = combineFilter(filter, andConditions);

  const [items, total] = await Promise.all([
    NotificationModel.find(finalFilter)
      .populate("userId", "email name")
      .populate("createdBy", "email name")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),

    NotificationModel.countDocuments(finalFilter),
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
  const andConditions: Record<string, unknown>[] = [buildSentFilter(true)];

  const isRead = parseBooleanLike(query.isRead);
  if (typeof isRead === "boolean") {
    filter.isRead = isRead;
  }

  if (query.type) {
    filter.type = query.type;
  }

  const keywordFilter = buildUserKeywordFilter(query.keyword);
  if (keywordFilter) {
    andConditions.push(keywordFilter);
  }

  const finalFilter = combineFilter(filter, andConditions);

  const [items, total, unreadCount] = await Promise.all([
    NotificationModel.find(finalFilter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),

    NotificationModel.countDocuments(finalFilter),

    NotificationModel.countDocuments(
      combineFilter(
        {
          userId: new Types.ObjectId(userId),
          isRead: false,
        },
        [buildSentFilter(true)]
      )
    ),
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

export async function updateAdminNotification(
  notificationId: string,
  payload: UpdateNotificationPayload
) {
  if (!Types.ObjectId.isValid(notificationId)) {
    throw createHttpError("Thông báo không hợp lệ", 400);
  }

  const updateData: UpdateNotificationPayload = {};

  if (payload.title !== undefined) updateData.title = payload.title;
  if (payload.message !== undefined) updateData.message = payload.message;
  if (payload.type !== undefined) updateData.type = payload.type;

  const notification = await NotificationModel.findOneAndUpdate(
    {
      _id: new Types.ObjectId(notificationId),
      isSent: false,
    },
    updateData,
    {
      new: true,
      runValidators: true,
    }
  ).lean();

  if (!notification) {
    throw createHttpError("Không tìm thấy thông báo chưa gửi", 404);
  }

  return notification;
}

export async function sendAdminNotification(notificationId: string) {
  if (!Types.ObjectId.isValid(notificationId)) {
    throw createHttpError("Thông báo không hợp lệ", 400);
  }

  const notification = await NotificationModel.findOneAndUpdate(
    {
      _id: new Types.ObjectId(notificationId),
      isSent: false,
    },
    {
      isSent: true,
      sentAt: new Date(),
    },
    {
      new: true,
    }
  ).lean();

  if (!notification) {
    throw createHttpError("Không tìm thấy thông báo chưa gửi", 404);
  }

  return notification;
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
