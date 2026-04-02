import { Router } from "express";
import { authGuard } from "../../middlewares/auth/authGuard";
import { classRoomController } from "./classroom.controller";
import { studentStudyController } from "../student/controller/student-study.controller";

export const classRoomRouter = Router();

// classroom list / detail
classRoomRouter.get("/", authGuard, classRoomController.getAll);
classRoomRouter.get("/deleted", authGuard, classRoomController.getDeleted);
classRoomRouter.get("/:id", authGuard, classRoomController.getById);
classRoomRouter.get("/:id/students", authGuard, classRoomController.getStudents);

// classroom crud
classRoomRouter.post("/", authGuard, classRoomController.create);
classRoomRouter.put("/:id", authGuard, classRoomController.update);
classRoomRouter.delete("/:id", authGuard, classRoomController.softDelete);
classRoomRouter.patch("/:id/restore", authGuard, classRoomController.restore);
classRoomRouter.delete("/:id/force", authGuard, classRoomController.forceDelete);

// study
classRoomRouter.patch(
  "/studies/:studyId/learning",
  authGuard,
  studentStudyController.updateLearning
);

classRoomRouter.patch(
  "/studies/:studyId/tests",
  authGuard,
  studentStudyController.updateTests
);

classRoomRouter.patch(
  "/studies/:studyId/honor",
  authGuard,
  studentStudyController.updateHonor
);

// FE mới đang gọi route này
classRoomRouter.patch(
  "/studies/:studyId/session",
  authGuard,
  studentStudyController.updateSession
);