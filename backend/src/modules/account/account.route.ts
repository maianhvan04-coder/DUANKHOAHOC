import { Router } from "express";
import { authGuard } from "../../middlewares/auth/authGuard";
import { validate } from "../../middlewares/validate";
import { upload } from "../../middlewares/upload.middleware";
import { accountController } from "./account.controller";
import {
  changeMyPasswordSchema,
  updateMyProfileSchema,
} from "./account.validate";

const router = Router();

router.get("/me", authGuard, accountController.getMe);

router.patch(
  "/me/profile",
  authGuard,
  upload.single("avatar"),
  validate(updateMyProfileSchema),
  accountController.updateMyProfile
);

router.patch(
  "/me/password",
  authGuard,
  validate(changeMyPasswordSchema),
  accountController.changeMyPassword
);

router.get("/me/payments", authGuard, accountController.getMyPayments);

export default router;