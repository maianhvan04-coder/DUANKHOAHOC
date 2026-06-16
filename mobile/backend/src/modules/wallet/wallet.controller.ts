import type { Request, Response } from "express";
import { z } from "zod";

import { asyncHandler } from "../../utils/asyncHandler";
import { walletService } from "./wallet.service";

type RequestUser = {
  id?: string;
  _id?: string;
};

const topupSchema = z.object({
  amount: z.coerce.number().int().positive(),
});

const enrollSchema = z.object({
  courseId: z.string().trim().min(1),
  mode: z.enum(["ONLINE", "OFFLINE"]),
});

function getUserId(req: Request) {
  const user = req.user as RequestUser | undefined;
  return String(user?.id || user?._id || "");
}

export const walletController = {
  getMine: asyncHandler(async (req: Request, res: Response) => {
    const data = await walletService.getMyWallet(getUserId(req));
    res.json(data);
  }),

  topup: asyncHandler(async (req: Request, res: Response) => {
    const payload = topupSchema.parse(req.body);
    const data = await walletService.topup(getUserId(req), payload.amount);
    res.json({
      message: "Nạp tiền thành công",
      ...data,
    });
  }),

  enroll: asyncHandler(async (req: Request, res: Response) => {
    const payload = enrollSchema.parse(req.body);
    const data = await walletService.enroll(getUserId(req), payload);
    res.status(201).json({
      message: "Đăng ký khóa học thành công",
      ...data,
    });
  }),
};
