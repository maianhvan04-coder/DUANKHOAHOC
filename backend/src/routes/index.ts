import { Router } from "express";
import { userRouter } from "../modules/user/user.route";
import { authRouter } from "../modules/auth/auth.route";
import { authGuard } from "../middlewares/authGuard";
import { requireRole } from "../middlewares/requireRole";
import { ROLES } from "../constants/roles";

export const router = Router();

router.use("/auth", authRouter);

// admin-only
router.use("/users", authGuard, requireRole(ROLES.ADMIN), userRouter);

// public
router.get("/health", (_req, res) => res.json({ ok: true }));
