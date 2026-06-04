import { Router } from "express";
import { PERMISSIONS } from "../../constants/permissions";
import { authGuard } from "../../middlewares/auth/authGuard";
import { authorize } from "../../middlewares/auth/authorize";
import { classRoomController } from "./classroom.controller";
import { studentStudyController } from "../student/controller/student-study.controller";

export const classRoomRouter = Router();

const teacherClassAccessPermissions = [
  PERMISSIONS.TEACHER_PORTAL_CLASS_READ,
  PERMISSIONS.TEACHER_PORTAL_CLASS_CREATE,
  PERMISSIONS.TEACHER_PORTAL_CLASS_UPDATE,
  PERMISSIONS.TEACHER_PORTAL_CLASS_CHANGE_STATUS,
  PERMISSIONS.TEACHER_PORTAL_STUDENT_UPDATE,
];

const classroomReadPermissions = [
  PERMISSIONS.CLASSROOM_READ,
  ...teacherClassAccessPermissions,
];

const classroomUpdatePermissions = [
  PERMISSIONS.CLASSROOM_UPDATE,
  PERMISSIONS.CLASSROOM_CHANGE_STATUS,
  PERMISSIONS.TEACHER_PORTAL_CLASS_UPDATE,
  PERMISSIONS.TEACHER_PORTAL_CLASS_CHANGE_STATUS,
];

const studentStudyUpdatePermissions = [
  PERMISSIONS.CLASSROOM_UPDATE,
  PERMISSIONS.CLASSROOM_UPDATE_LEARNING,
  PERMISSIONS.TEACHER_PORTAL_STUDENT_UPDATE,
];

// classroom list / detail
classRoomRouter.get(
  "/",
  authGuard,
  authorize({ permissionsAny: [PERMISSIONS.CLASSROOM_READ] }),
  classRoomController.getAll
);
classRoomRouter.get(
  "/mine",
  authGuard,
  authorize({ permissionsAny: teacherClassAccessPermissions }),
  classRoomController.getMine
);
classRoomRouter.get(
  "/deleted",
  authGuard,
  authorize({
    permissionsAny: [PERMISSIONS.CLASSROOM_READ, PERMISSIONS.CLASSROOM_DELETE],
  }),
  classRoomController.getDeleted
);
classRoomRouter.get(
  "/:id",
  authGuard,
  authorize({ permissionsAny: classroomReadPermissions }),
  classRoomController.getById
);
classRoomRouter.get(
  "/:id/students",
  authGuard,
  authorize({
    permissionsAny: [
      ...studentStudyUpdatePermissions,
      PERMISSIONS.CLASSROOM_READ,
      PERMISSIONS.CLASSROOM_ASSIGN_STUDENT,
    ],
  }),
  classRoomController.getStudents
);

// classroom crud
classRoomRouter.post(
  "/",
  authGuard,
  authorize({
    permissionsAny: [
      PERMISSIONS.CLASSROOM_CREATE,
      PERMISSIONS.TEACHER_PORTAL_CLASS_CREATE,
    ],
  }),
  classRoomController.create
);
classRoomRouter.put(
  "/:id",
  authGuard,
  authorize({ permissionsAny: classroomUpdatePermissions }),
  classRoomController.update
);
classRoomRouter.delete(
  "/:id",
  authGuard,
  authorize({ permissionsAny: [PERMISSIONS.CLASSROOM_DELETE] }),
  classRoomController.softDelete
);
classRoomRouter.patch(
  "/:id/restore",
  authGuard,
  authorize({ permissionsAny: classroomUpdatePermissions }),
  classRoomController.restore
);
classRoomRouter.delete(
  "/:id/force",
  authGuard,
  authorize({ permissionsAny: [PERMISSIONS.CLASSROOM_DELETE] }),
  classRoomController.forceDelete
);

// study
classRoomRouter.patch(
  "/studies/:studyId/learning",
  authGuard,
  authorize({ permissionsAny: studentStudyUpdatePermissions }),
  studentStudyController.updateLearning
);

classRoomRouter.patch(
  "/studies/:studyId/tests",
  authGuard,
  authorize({ permissionsAny: studentStudyUpdatePermissions }),
  studentStudyController.updateTests
);

classRoomRouter.patch(
  "/studies/:studyId/honor",
  authGuard,
  authorize({
    permissionsAny: [
      PERMISSIONS.CLASSROOM_CHANGE_STATUS,
      PERMISSIONS.CLASSROOM_UPDATE_HONOR,
    ],
  }),
  studentStudyController.updateHonor
);

// FE mới đang gọi route này
classRoomRouter.patch(
  "/studies/:studyId/session",
  authGuard,
  authorize({ permissionsAny: studentStudyUpdatePermissions }),
  studentStudyController.updateSession
);
