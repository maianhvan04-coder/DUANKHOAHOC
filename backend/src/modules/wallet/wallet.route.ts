import { Router } from "express";

import { authGuard } from "../../middlewares/auth/authGuard";
import { authorize } from "../../middlewares/auth/authorize";
import { PERMISSIONS } from "../../constants/permissions";
import { walletController } from "./wallet.controller";

export const walletRouter = Router();

walletRouter.get("/me", authGuard, walletController.getMine);
walletRouter.post("/topup", authGuard, walletController.topup);
walletRouter.post("/enroll", authGuard, walletController.enroll);
walletRouter.get(
  "/admin/balance-history",
  authGuard,
  authorize({ permissionsAny: [PERMISSIONS.BALANCE_HISTORY_READ] }),
  walletController.listAdminBalanceHistory
);
walletRouter.get(
  "/admin/bank-history",
  authGuard,
  authorize({ permissionsAny: [PERMISSIONS.BANK_HISTORY_READ] }),
  walletController.listAdminBankHistory
);
walletRouter.post(
  "/admin/users/:userId/balance",
  authGuard,
  authorize({ permissionsAny: [PERMISSIONS.WALLET_BALANCE_UPDATE] }),
  walletController.updateUserBalance
);
