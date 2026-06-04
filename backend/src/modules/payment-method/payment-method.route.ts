import { Router } from "express";
import type { RequestHandler } from "express";

import { PERMISSIONS, type PermissionKey } from "../../constants/permissions";
import { ROLES } from "../../constants/roles";
import { authGuard } from "../../middlewares/auth/authGuard";
import { paymentMethodController } from "./payment-method.controller";

export const paymentMethodRouter = Router();

function adminManagerOrPermission(
  permissionsAny: PermissionKey[]
): RequestHandler[] {
  return [
    authGuard,
    (req, res, next) => {
      const roles = req.user?.roles ?? [];
      const permissions = req.user?.permissions ?? [];

      const hasAdminRole =
        roles.includes(ROLES.ADMIN) || roles.includes(ROLES.MANAGER);
      const hasPermission = permissionsAny.some((permission) =>
        permissions.includes(permission)
      );

      if (hasAdminRole || hasPermission) {
        return next();
      }

      return res.status(403).json({
        message: "Bạn không có quyền thực hiện chức năng này",
      });
    },
  ];
}

paymentMethodRouter.get("/", paymentMethodController.listActive);
paymentMethodRouter.get(
  "/admin",
  adminManagerOrPermission([PERMISSIONS.PAYMENT_METHOD_READ]),
  paymentMethodController.listAdmin
);
paymentMethodRouter.post(
  "/admin",
  adminManagerOrPermission([PERMISSIONS.PAYMENT_METHOD_CREATE]),
  paymentMethodController.create
);
paymentMethodRouter.put(
  "/admin/:id",
  adminManagerOrPermission([
    PERMISSIONS.PAYMENT_METHOD_UPDATE,
    PERMISSIONS.PAYMENT_METHOD_CHANGE_STATUS,
  ]),
  paymentMethodController.update
);
paymentMethodRouter.delete(
  "/admin/:id",
  adminManagerOrPermission([PERMISSIONS.PAYMENT_METHOD_DELETE]),
  paymentMethodController.remove
);
