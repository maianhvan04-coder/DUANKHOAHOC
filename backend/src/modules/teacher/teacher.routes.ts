import { Router } from "express";
import { authGuard } from "../../middlewares/auth/authGuard";
import { authorize } from "../../middlewares/auth/authorize";
import { validate } from "../../middlewares/validate";
import { PERMISSIONS } from "../../constants/permissions";
import { teacherController } from "./teacher.controller";
import {
  createTeacherSchema,
  teacherIdParamSchema,
  teacherListQuerySchema,
  teacherStatusSchema,
  updateTeacherSchema,
} from "./teacher.schema";
import { upload } from "../../config/multer";

export const teacherRouter = Router();

teacherRouter.get(
  "/",
  authGuard,
  authorize({
    permissionsAny: [PERMISSIONS.TEACHER_READ],
  }),
  validate(teacherListQuerySchema),
  teacherController.listAdmin
);

teacherRouter.get("/public/list", teacherController.listPublic);

teacherRouter.get(
  "/:id",
  authGuard,
  authorize({
    permissionsAny: [PERMISSIONS.TEACHER_READ],
  }),
  validate(teacherIdParamSchema),
  teacherController.getById
);

teacherRouter.post(
  "/",
  authGuard,
  authorize({
    permissionsAny: [PERMISSIONS.TEACHER_CREATE],
  }),
  upload.single("avatar"),
  validate(createTeacherSchema),
  teacherController.create
);

teacherRouter.put(
  "/:id",
  authGuard,
  authorize({
    permissionsAny: [PERMISSIONS.TEACHER_UPDATE],
  }),
  upload.single("avatar"),
  validate(updateTeacherSchema),
  teacherController.update
);

teacherRouter.patch(
  "/:id/status",
  authGuard,
  authorize({
    permissionsAny: [PERMISSIONS.TEACHER_CHANGE_STATUS],
  }),
  validate(teacherStatusSchema),
  teacherController.setStatus
);

teacherRouter.delete(
  "/:id",
  authGuard,
  authorize({
    permissionsAny: [PERMISSIONS.TEACHER_DELETE],
  }),
  validate(teacherIdParamSchema),
  teacherController.softDelete
);

teacherRouter.patch(
  "/:id/restore",
  authGuard,
  authorize({
    permissionsAny: [
      PERMISSIONS.TEACHER_UPDATE,
      PERMISSIONS.TEACHER_CHANGE_STATUS,
    ],
  }),
  validate(teacherIdParamSchema),
  teacherController.restore
);

teacherRouter.delete(
  "/:id/hard",
  authGuard,
  authorize({
    permissionsAny: [PERMISSIONS.TEACHER_DELETE],
  }),
  validate(teacherIdParamSchema),
  teacherController.hardDelete
);