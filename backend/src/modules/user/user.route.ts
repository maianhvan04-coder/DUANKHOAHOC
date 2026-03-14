import { Router } from "express";
import { userController } from "./user.controller";

export const userRouter = Router();

userRouter.get("/", userController.list);
userRouter.get("/:id", userController.get);
userRouter.post("/", userController.create);
userRouter.patch("/:id", userController.update);

// ✅ toggle active
userRouter.patch("/:id/active", userController.setActive);

// ✅ Users tab: xoá mềm (=> INACTIVE + deletedAt)
userRouter.delete("/:id", userController.remove);

// ✅ Deleted tab: xoá cứng
userRouter.delete("/:id/hard", userController.hardRemove);

// ✅ restore
userRouter.patch("/:id/restore", userController.restore);