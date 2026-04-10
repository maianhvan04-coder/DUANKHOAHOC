import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { accountService } from "./account.service";

type RequestUser = {
  id?: string;
  _id?: string;
};

function getUserId(req: Request): string {
  const user = req.user as RequestUser | undefined;
  return String(user?.id || user?._id || "");
}

type ChangePasswordBody = {
  currentPassword: string;
  newPassword: string;
};

type UpdateProfileBody = {
  name?: string;
};

export const accountController = {
  getMe: asyncHandler(async (req: Request, res: Response) => {
    const user = await accountService.getMe(getUserId(req));
    res.json({ user });
  }),

  updateMyProfile: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as UpdateProfileBody;

    const user = await accountService.updateMyProfile({
      userId: getUserId(req),
      name: String(body.name || "").trim(),
      avatarFile: req.file,
    });

    res.json({
      message: "Cập nhật thông tin thành công",
      user,
    });
  }),

  changeMyPassword: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as ChangePasswordBody;

    await accountService.changeMyPassword({
      userId: getUserId(req),
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    });

    res.json({
      message: "Đổi mật khẩu thành công",
    });
  }),

  getMyPayments: asyncHandler(async (req: Request, res: Response) => {
    const items = await accountService.getMyPayments(getUserId(req));
    res.json({ items });
  }),
};