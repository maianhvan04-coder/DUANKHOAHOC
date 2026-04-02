import { Router } from "express";
import { validate } from "../../../middlewares/validate";
import { authGuard } from "../../../middlewares/auth/authGuard";
import { authorize } from "../../../middlewares/auth/authorize";
import { PERMISSIONS } from "../../../constants/permissions";
import {
  getAdminPaymentHistoryController,
  getAdminPaymentHistoryDetailController,
  getMyPaymentHistoryController,
  getMyPaymentHistoryDetailController,
} from "./payment-audit.controller";
import {
  getAdminPaymentHistoryDetailSchema,
  getAdminPaymentHistorySchema,
  getMyPaymentHistoryDetailSchema,
  getMyPaymentHistorySchema,
} from "./payment-audit.validate";

const router = Router();

router.get(
  "/me",
  authGuard,
  authorize({
    permissionsAny: [PERMISSIONS.PAYMENT_AUDIT_READ_OWN],
  }),
  validate(getMyPaymentHistorySchema),
  getMyPaymentHistoryController
);

router.get(
  "/me/:paymentCode",
  authGuard,
  authorize({
    permissionsAny: [PERMISSIONS.PAYMENT_AUDIT_READ_OWN],
  }),
  validate(getMyPaymentHistoryDetailSchema),
  getMyPaymentHistoryDetailController
);

router.get(
  "/admin",
  authGuard,
  authorize({
    permissionsAny: [
      PERMISSIONS.PAYMENT_AUDIT_READ_ALL,
      PERMISSIONS.PAYMENT_AUDIT_MANAGE,
    ],
  }),
  validate(getAdminPaymentHistorySchema),
  getAdminPaymentHistoryController
);

router.get(
  "/admin/:paymentCode",
  authGuard,
  authorize({
    permissionsAny: [
      PERMISSIONS.PAYMENT_AUDIT_READ_ALL,
      PERMISSIONS.PAYMENT_AUDIT_MANAGE,
    ],
  }),
  validate(getAdminPaymentHistoryDetailSchema),
  getAdminPaymentHistoryDetailController
);

export default router;