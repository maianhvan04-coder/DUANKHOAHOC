import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { authGuard } from "../../middlewares/auth/authGuard";
import { authorize } from "../../middlewares/auth/authorize";
import { getDashboardController } from "./dashboard.controller";
import { getDashboardSchema } from "./dashboard.validate";
import { PERMISSIONS } from "../../constants/permissions";

const router = Router();

router.get(
  "/",
  authGuard,
  authorize({
    permissionsAny: [PERMISSIONS.DASHBOARD_READ],
  }),
  validate(getDashboardSchema),
  getDashboardController
);

export default router;