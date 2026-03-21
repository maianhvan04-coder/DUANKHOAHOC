import { Router } from "express";
import { authGuard } from "../../middlewares/auth/authGuard";
import { classRoomController } from "./classroom.controller";
import { studentStudyController } from "../student/controller/student-study.controller";

export const classRoomRouter = Router();

classRoomRouter.get("/", authGuard, classRoomController.getAll);
classRoomRouter.get("/deleted", authGuard, classRoomController.getDeleted);
classRoomRouter.get("/:id", authGuard, classRoomController.getById);
classRoomRouter.get("/:id/students", authGuard, classRoomController.getStudents);

classRoomRouter.post("/", authGuard, classRoomController.create);
classRoomRouter.put("/:id", authGuard, classRoomController.update);
classRoomRouter.delete("/:id", authGuard, classRoomController.softDelete);
classRoomRouter.patch("/:id/restore", authGuard, classRoomController.restore);
classRoomRouter.delete("/:id/force", authGuard, classRoomController.forceDelete);

// cập nhật điểm / tiến độ / điểm danh theo từng học viên trong lớp
classRoomRouter.patch(
  "/studies/:studyId/learning",
  authGuard,
  studentStudyController.updateLearning
);

// bật tắt vinh danh + hiển thị bên user
classRoomRouter.patch(
  "/studies/:studyId/honor",
  authGuard,
  studentStudyController.updateHonor
);