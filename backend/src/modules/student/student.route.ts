import { Router } from "express";
import { authGuard } from "../../middlewares/auth/authGuard";
import { studentController } from "./controller/student.controller";
import { studentStudyController } from "./controller/student-study.controller";

export const studentRouter = Router();

// public
studentRouter.get("/public/honors", studentStudyController.getPublicHonors);

// study
studentRouter.get("/studies", authGuard, studentStudyController.getAll);
studentRouter.put("/studies/:studyId", authGuard, studentStudyController.update);
studentRouter.delete("/studies/:studyId", authGuard, studentStudyController.remove);

studentRouter.patch(
  "/studies/:studyId/learning",
  authGuard,
  studentStudyController.updateLearning
);

studentRouter.patch(
  "/studies/:studyId/tests",
  authGuard,
  studentStudyController.updateTests
);

studentRouter.patch(
  "/studies/:studyId/honor",
  authGuard,
  studentStudyController.updateHonor
);

studentRouter.patch(
  "/studies/:studyId/session",
  authGuard,
  studentStudyController.updateSession
);

// student basic
studentRouter.get("/", authGuard, studentController.getAll);
studentRouter.get("/deleted", authGuard, studentController.getDeleted);
studentRouter.get("/:id", authGuard, studentController.getById);
studentRouter.post("/", authGuard, studentController.create);
studentRouter.put("/:id", authGuard, studentController.update);
studentRouter.patch("/:id/active", authGuard, studentController.setActive);
studentRouter.patch("/:id/restore", authGuard, studentController.restore);
studentRouter.delete("/:id/force", authGuard, studentController.forceDelete);
studentRouter.delete("/:id", authGuard, studentController.softDelete);

// study by student
studentRouter.get("/:id/studies", authGuard, studentStudyController.getByStudent);
studentRouter.post("/:id/studies", authGuard, studentStudyController.createForStudent);