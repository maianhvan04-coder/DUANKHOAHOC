import { Router } from "express";
import {
  createCheckoutSessionController,
  getMyOrderStatusController,
  vnpayIpnController,
  vnpayReturnController,
} from "./payment.controller";
import { authGuard } from "../../middlewares/auth/authGuard";
import { validate } from "../../middlewares/validate";
import {
  createCheckoutSessionSchema,
  getOrderStatusSchema,
  vnpayCallbackSchema,
} from "./payment.validation";

const router = Router();

router.post(
  "/checkout/create-session",
  authGuard,
  validate(createCheckoutSessionSchema),
  createCheckoutSessionController
);

router.get(
  "/orders/:paymentCode",
  authGuard,
  validate(getOrderStatusSchema),
  getMyOrderStatusController
);

router.get(
  "/vnpay/ipn",
  validate(vnpayCallbackSchema),
  vnpayIpnController
);

router.get(
  "/vnpay/return",
  validate(vnpayCallbackSchema),
  vnpayReturnController
);

export default router;