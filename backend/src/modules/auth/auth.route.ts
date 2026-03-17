// src/modules/auth/auth.router.ts
import { Router } from "express";
import { authController } from "./auth.controller";
import { authGuard } from "../../middlewares/auth/authGuard";
import { validate } from "../../middlewares/validate";
import { authSchemas } from "./auth.validation";

export const authRouter = Router();

authRouter.post("/register", validate(authSchemas.register), authController.register);
authRouter.post("/login", validate(authSchemas.login), authController.login);

// refresh access token bằng refresh token trong HttpOnly cookie
authRouter.post("/refresh", validate(authSchemas.refresh), authController.refresh);

// logout: revoke session + clear cookie
authRouter.post("/logout", validate(authSchemas.logout), authController.logout);

authRouter.get("/me", authGuard, (req, res) => {
  res.json({ user: (req as any).user });
});
