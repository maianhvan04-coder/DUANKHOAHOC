import { Router } from "express";

import { ROLES } from "../../constants/roles";
import { authGuard } from "../../middlewares/auth/authGuard";
import { authorize } from "../../middlewares/auth/authorize";
import { paymentMethodController } from "./payment-method.controller";

export const paymentMethodRouter = Router();

const adminOnly = [authGuard, authorize({ rolesAny: [ROLES.ADMIN, ROLES.MANAGER] })];

paymentMethodRouter.get("/", paymentMethodController.listActive);
paymentMethodRouter.get("/admin", adminOnly, paymentMethodController.listAdmin);
paymentMethodRouter.post("/admin", adminOnly, paymentMethodController.create);
paymentMethodRouter.put("/admin/:id", adminOnly, paymentMethodController.update);
paymentMethodRouter.delete("/admin/:id", adminOnly, paymentMethodController.remove);
