import { Router } from "express";
import { validate } from "../../../middlewares/validate";
import { authGuard } from "../../../middlewares/auth/authGuard";
import { authorize } from "../../../middlewares/auth/authorize";
import { PERMISSIONS } from "../../../constants/permissions";
import {
  getAdminSecurityAuditsController,
  getMySecurityAuditsController,
} from "./security-audit.controller";
import {
  getAdminSecurityAuditsSchema,
  getMySecurityAuditsSchema,
} from "./security-audit.validate";

const router = Router();

router.get(
  "/me",
  authGuard,
  authorize({
    permissionsAny: [PERMISSIONS.SECURITY_AUDIT_READ_OWN],
  }),
  validate(getMySecurityAuditsSchema),
  getMySecurityAuditsController
);

router.get(
  "/admin",
  authGuard,
  authorize({
    permissionsAny: [
      PERMISSIONS.SECURITY_AUDIT_READ_ALL,
      PERMISSIONS.SECURITY_AUDIT_MANAGE,
    ],
  }),
  validate(getAdminSecurityAuditsSchema),
  getAdminSecurityAuditsController
);

export default router;