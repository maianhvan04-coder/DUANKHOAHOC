import { Router } from "express";
import { validate } from "../../middlewares/validate";
import {
  createAdminNotificationController,
  deleteAdminNotificationController,
  getAdminNotificationsController,
  getNotificationRecipientsController,
  getMyNotificationsController,
  markAllMyNotificationsAsReadController,
  markMyNotificationAsReadController,
} from "./notification.controller";
import {
  createNotificationSchema,
  getNotificationsQuerySchema,
  notificationIdSchema,
} from "./notification.validation";

export const adminNotificationRouter = Router();
export const userNotificationRouter = Router();

/**
 * Admin APIs
 * Prefix đề xuất: /api/admin/notifications
 */
adminNotificationRouter.post(
  "/",
  validate(createNotificationSchema),
  createAdminNotificationController
);

adminNotificationRouter.get(
  "/",
  validate(getNotificationsQuerySchema),
  getAdminNotificationsController
);

adminNotificationRouter.get(
  "/recipients",
  getNotificationRecipientsController
);

adminNotificationRouter.delete(
  "/:id",
  validate(notificationIdSchema),
  deleteAdminNotificationController
);

/**
 * User APIs
 * Prefix đề xuất: /api/web/notifications
 */
userNotificationRouter.get(
  "/me",
  validate(getNotificationsQuerySchema),
  getMyNotificationsController
);

userNotificationRouter.patch(
  "/:id/read",
  validate(notificationIdSchema),
  markMyNotificationAsReadController
);

userNotificationRouter.patch(
  "/read-all",
  markAllMyNotificationsAsReadController
);
