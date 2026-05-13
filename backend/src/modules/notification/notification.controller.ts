import type { NextFunction, Request, Response } from "express";
import {
  createNotification,
  deleteAdminNotification,
  getAdminNotifications,
  getNotificationRecipients,
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  sendAdminNotification,
  updateAdminNotification,
  type NotificationListQuery,
} from "./notification.service";

type RequestUserIdValue = string | { toString: () => string };

type RequestUser = {
  id?: RequestUserIdValue;
  _id?: RequestUserIdValue;
  userId?: RequestUserIdValue;
};

type AuthRequest = Request & {
  user?: RequestUser;
};

type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

type CreateNotificationBody = {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
};

type UpdateNotificationBody = {
  title?: string;
  message?: string;
  type?: NotificationType;
};

type HttpError = Error & {
  statusCode?: number;
};

function createHttpError(message: string, statusCode: number): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
}

function getAuthUserId(req: Request): string {
  const authReq = req as AuthRequest;

  const rawUserId =
    authReq.user?.id ?? authReq.user?._id ?? authReq.user?.userId ?? null;

  if (!rawUserId) {
    throw createHttpError("Vui lòng đăng nhập", 401);
  }

  return rawUserId.toString();
}

function getParamString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function getNotificationQuery(req: Request): NotificationListQuery {
  return req.query as unknown as NotificationListQuery;
}

export async function createAdminNotificationController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const adminId = getAuthUserId(req);
    const body = req.body as CreateNotificationBody;

    const notification = await createNotification({
      userId: body.userId,
      title: body.title,
      message: body.message,
      type: body.type ?? "INFO",
      createdBy: adminId,
    });

    return res.status(201).json({
      ok: true,
      message: "Tạo thông báo thành công",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminNotificationsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await getAdminNotifications(getNotificationQuery(req));

    return res.json({
      ok: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getNotificationRecipientsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await getNotificationRecipients(
      req.query as { keyword?: string; limit?: string }
    );

    return res.json({
      ok: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAdminNotificationController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const notificationId = getParamString(req.params.id);

    const notification = await deleteAdminNotification(notificationId);

    return res.json({
      ok: true,
      message: "Xóa thông báo thành công",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminNotificationController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const notificationId = getParamString(req.params.id);
    const body = req.body as UpdateNotificationBody;

    const notification = await updateAdminNotification(notificationId, {
      title: body.title,
      message: body.message,
      type: body.type,
    });

    return res.json({
      ok: true,
      message: "Cập nhật thông báo thành công",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}

export async function sendAdminNotificationController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const notificationId = getParamString(req.params.id);
    const notification = await sendAdminNotification(notificationId);

    return res.json({
      ok: true,
      message: "Đã gửi thông báo",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyNotificationsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = getAuthUserId(req);

    const result = await getUserNotifications(userId, getNotificationQuery(req));

    return res.json({
      ok: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function markMyNotificationAsReadController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = getAuthUserId(req);
    const notificationId = getParamString(req.params.id);

    const notification = await markNotificationAsRead(notificationId, userId);

    return res.json({
      ok: true,
      message: "Đã đọc thông báo",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}

export async function markAllMyNotificationsAsReadController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = getAuthUserId(req);

    await markAllNotificationsAsRead(userId);

    return res.json({
      ok: true,
      message: "Đã đọc tất cả thông báo",
    });
  } catch (error) {
    next(error);
  }
}
