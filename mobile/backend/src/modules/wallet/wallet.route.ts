import { Router } from "express";

import { authGuard } from "../../middlewares/auth/authGuard";
import { walletController } from "./wallet.controller";

export const walletRouter = Router();

walletRouter.get("/me", authGuard, walletController.getMine);
walletRouter.post("/topup", authGuard, walletController.topup);
walletRouter.post("/enroll", authGuard, walletController.enroll);
