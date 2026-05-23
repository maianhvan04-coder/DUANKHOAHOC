import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { authGuard } from "../../middlewares/auth/authGuard";
import { authorize } from "../../middlewares/auth/authorize";
import { ROLES } from "../../constants/roles";
import { aiController } from "./ai.controller";
import { aiMessageSchema, aiNotificationDraftSchema } from "./ai.validation";

export const aiRouter = Router();

aiRouter.post(
  "/public-advisor",
  validate(aiMessageSchema),
  aiController.publicAdvisor
);

aiRouter.post(
  "/student-assistant",
  authGuard,
  authorize({ rolesAny: [ROLES.STUDENT] }),
  validate(aiMessageSchema),
  aiController.studentAssistant
);

aiRouter.post(
  "/admin-assistant",
  authGuard,
  authorize({ rolesAny: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TEACHER] }),
  validate(aiMessageSchema),
  aiController.adminAssistant
);

aiRouter.post(
  "/admin-notification-draft",
  authGuard,
  authorize({ rolesAny: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TEACHER] }),
  validate(aiNotificationDraftSchema),
  aiController.adminNotificationDraft
);
