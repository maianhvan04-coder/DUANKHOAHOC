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

const adminBalanceSchema = z.object({
  amount: z.coerce.number().int().positive(),
  transactionType: z.enum(["CREDIT", "DEBIT"]).default("CREDIT"),
  paymentMethodId: z.string().trim().min(1),
  transactionCode: z.string().trim().max(100).optional().default(""),
  currency: z.string().trim().max(12).optional().default("VND"),
  note: z.string().trim().min(1).max(500),
});

const adminHistoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  keyword: z.string().trim().optional(),
  reference: z.string().trim().optional(),
  type: z.enum(["TOPUP", "ENROLL", "REFUND", "ADMIN_DEBIT"]).optional(),
  fromDate: z.string().trim().optional(),
  toDate: z.string().trim().optional(),
  sortBy: z
    .enum(["createdAt", "amount", "balanceBefore", "balanceAfter", "type"])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
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

  updateUserBalance: asyncHandler(async (req: Request, res: Response) => {
    const payload = adminBalanceSchema.parse(req.body);
    const data = await walletService.updateUserBalance(
      String(req.params.userId || ""),
      {
        ...payload,
        actorId: getUserId(req),
      }
    );

    res.json({
      message: "Cập nhật số dư thành công",
      ...data,
    });
  }),

  listAdminBalanceHistory: asyncHandler(async (req: Request, res: Response) => {
    const query = adminHistoryQuerySchema.parse(req.query);
    const data = await walletService.listAdminBalanceHistory(query);
    res.json({
      ok: true,
      ...data,
    });
  }),

  listAdminBankHistory: asyncHandler(async (req: Request, res: Response) => {
    const query = adminHistoryQuerySchema.parse(req.query);
    const data = await walletService.listAdminBankHistory(query);
    res.json({
      ok: true,
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
