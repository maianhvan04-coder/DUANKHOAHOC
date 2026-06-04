import { Router } from "express";
import { PERMISSIONS } from "../../constants/permissions";
import { authGuard } from "../../middlewares/auth/authGuard";
import { authorize } from "../../middlewares/auth/authorize";
import { studentController } from "./controller/student.controller";
import { studentStudyController } from "./controller/student-study.controller";

export const studentRouter = Router();

const studentReadPermissions = [
  PERMISSIONS.STUDENT_READ,
  PERMISSIONS.CLASSROOM_READ,
  PERMISSIONS.STUDENT_PORTAL_ACCESS,
  PERMISSIONS.STUDENT_PORTAL_DASHBOARD_READ,
  PERMISSIONS.STUDENT_PORTAL_SCHEDULE_READ,
  PERMISSIONS.STUDENT_PORTAL_GRADE_READ,
  PERMISSIONS.TEACHER_PORTAL_STUDENT_UPDATE,
];

const studentUpdatePermissions = [
  PERMISSIONS.STUDENT_UPDATE,
  PERMISSIONS.STUDENT_CHANGE_STATUS,
  PERMISSIONS.CLASSROOM_UPDATE,
  PERMISSIONS.CLASSROOM_UPDATE_LEARNING,
  PERMISSIONS.TEACHER_PORTAL_STUDENT_UPDATE,
];

const studentLearningUpdatePermissions = [
  PERMISSIONS.STUDENT_UPDATE,
  PERMISSIONS.CLASSROOM_UPDATE,
  PERMISSIONS.CLASSROOM_UPDATE_LEARNING,
  PERMISSIONS.TEACHER_PORTAL_STUDENT_UPDATE,
];

// public
studentRouter.get("/public/honors", studentStudyController.getPublicHonors);

// study
studentRouter.get(
  "/studies",
  authGuard,
  authorize({ permissionsAny: studentReadPermissions }),
  studentStudyController.getAll
);
studentRouter.put(
  "/studies/:studyId",
  authGuard,
  authorize({ permissionsAny: studentUpdatePermissions }),
  studentStudyController.update
);
studentRouter.delete(
  "/studies/:studyId",
  authGuard,
  authorize({ permissionsAny: [PERMISSIONS.STUDENT_DELETE] }),
  studentStudyController.remove
);

studentRouter.patch(
  "/studies/:studyId/learning",
  authGuard,
  authorize({ permissionsAny: studentLearningUpdatePermissions }),
  studentStudyController.updateLearning
);

studentRouter.patch(
  "/studies/:studyId/tests",
  authGuard,
  authorize({ permissionsAny: studentLearningUpdatePermissions }),
  studentStudyController.updateTests
);

studentRouter.patch(
  "/studies/:studyId/honor",
  authGuard,
  authorize({
    permissionsAny: [
      PERMISSIONS.STUDENT_UPDATE,
      PERMISSIONS.CLASSROOM_CHANGE_STATUS,
      PERMISSIONS.CLASSROOM_UPDATE_HONOR,
    ],
  }),
  studentStudyController.updateHonor
);

studentRouter.patch(
  "/studies/:studyId/session",
  authGuard,
  authorize({ permissionsAny: studentLearningUpdatePermissions }),
  studentStudyController.updateSession
);

// student basic
studentRouter.get(
  "/",
  authGuard,
  authorize({ permissionsAny: [PERMISSIONS.STUDENT_READ] }),
  studentController.getAll
);
studentRouter.get(
  "/deleted",
  authGuard,
  authorize({ permissionsAny: [PERMISSIONS.STUDENT_READ, PERMISSIONS.STUDENT_DELETE] }),
  studentController.getDeleted
);
studentRouter.get(
  "/:id",
  authGuard,
  authorize({ permissionsAny: studentReadPermissions }),
  studentController.getById
);
studentRouter.post(
  "/",
  authGuard,
  authorize({ permissionsAny: [PERMISSIONS.STUDENT_CREATE] }),
  studentController.create
);
studentRouter.put(
  "/:id",
  authGuard,
  authorize({ permissionsAny: [PERMISSIONS.STUDENT_UPDATE] }),
  studentController.update
);
studentRouter.patch(
  "/:id/active",
  authGuard,
  authorize({ permissionsAny: [PERMISSIONS.STUDENT_CHANGE_STATUS] }),
  studentController.setActive
);
studentRouter.patch(
  "/:id/restore",
  authGuard,
  authorize({
    permissionsAny: [PERMISSIONS.STUDENT_UPDATE, PERMISSIONS.STUDENT_CHANGE_STATUS],
  }),
  studentController.restore
);
studentRouter.delete(
  "/:id/force",
  authGuard,
  authorize({ permissionsAny: [PERMISSIONS.STUDENT_DELETE] }),
  studentController.forceDelete
);
studentRouter.delete(
  "/:id",
  authGuard,
  authorize({ permissionsAny: [PERMISSIONS.STUDENT_DELETE] }),
  studentController.softDelete
);

// study by student
studentRouter.get(
  "/:id/studies",
  authGuard,
  authorize({ permissionsAny: studentReadPermissions }),
  studentStudyController.getByStudent
);
studentRouter.post(
  "/:id/studies",
  authGuard,
  authorize({
    permissionsAny: [
      PERMISSIONS.STUDENT_UPDATE,
      PERMISSIONS.CLASSROOM_ASSIGN_STUDENT,
    ],
  }),
  studentStudyController.createForStudent
);
