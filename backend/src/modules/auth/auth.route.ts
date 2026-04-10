import { Router } from "express";
import { authController } from "./auth.controller";
import { authGuard } from "../../middlewares/auth/authGuard";
import { validate } from "../../middlewares/validate";
import { authSchemas } from "./auth.validation";
import { UserModel } from "../user/user.model";
import { asyncHandler } from "../../utils/asyncHandler";

export const authRouter = Router();

authRouter.post("/register", validate(authSchemas.register), authController.register);
authRouter.post("/login", validate(authSchemas.login), authController.login);
authRouter.post("/refresh", validate(authSchemas.refresh), authController.refresh);
authRouter.post("/logout", validate(authSchemas.logout), authController.logout);

authRouter.get(
  "/me",
  authGuard,
  asyncHandler(async (req, res) => {
    const authUser = req.user;

    if (!authUser) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập",
      });
    }

    const user = await UserModel.findById(authUser.id)
      .select("name email avatar")
      .lean();

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng",
      });
    }

    res.json({
      user: {
        id: authUser.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar ?? null,
      },
      access: {
        primaryRole: authUser.role,
        roles: authUser.roles,
        permissions: authUser.permissions,
      },
    });
  })
);