import { Router } from "express";
import { userController } from "./user.controller";
import { authGuard } from "../../middlewares/auth/authGuard";
import { authorize } from "../../middlewares/auth/authorize";
import { PERMISSIONS } from "../../constants/permissions";

export const userRouter = Router();

userRouter.get(
  "/",
  authGuard,
  authorize({ permissionsAny: [PERMISSIONS.USER_READ] }),
  userController.list
);

userRouter.get(
  "/:id",
  authGuard,
  authorize({ permissionsAny: [PERMISSIONS.USER_READ] }),
  userController.get
);

userRouter.post(
  "/",
  authGuard,
  authorize({ permissionsAny: [PERMISSIONS.USER_CREATE] }),
  userController.create
);

userRouter.patch(
  "/:id",
  authGuard,
  authorize({ permissionsAny: [PERMISSIONS.USER_UPDATE] }),
  userController.update
);

userRouter.patch(
  "/:id/active",
  authGuard,
  authorize({ permissionsAny: [PERMISSIONS.USER_CHANGE_STATUS] }),
  userController.setActive
);

userRouter.delete(
  "/:id",
  authGuard,
  authorize({ permissionsAny: [PERMISSIONS.USER_DELETE] }),
  userController.remove
);

userRouter.delete(
  "/:id/hard",
  authGuard,
  authorize({ permissionsAny: [PERMISSIONS.USER_DELETE] }),
  userController.hardRemove
);

userRouter.patch(
  "/:id/restore",
  authGuard,
  authorize({ permissionsAny: [PERMISSIONS.USER_UPDATE] }),
  userController.restore
);