import type { Request, Response } from "express";
import { z } from "zod";

import { asyncHandler } from "../../utils/asyncHandler";
import { paymentMethodService } from "./payment-method.service";

const methodSchema = z.object({
  name: z.string().trim().optional(),
  code: z.string().trim().optional(),
  type: z.enum(["BANK", "EWALLET", "CRYPTO"]).optional(),
  bankName: z.string().trim().optional(),
  accountNumber: z.string().trim().optional(),
  accountName: z.string().trim().optional(),
  logo: z.string().trim().optional(),
  qrImage: z.string().trim().optional(),
  description: z.string().trim().optional(),
  transferPrefix: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
});

const updateMethodSchema = methodSchema.partial();

export const paymentMethodController = {
  listActive: asyncHandler(async (_req: Request, res: Response) => {
    const data = await paymentMethodService.listActive();
    res.json(data);
  }),

  listAdmin: asyncHandler(async (_req: Request, res: Response) => {
    const data = await paymentMethodService.listAdmin();
    res.json(data);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const payload = methodSchema.parse(req.body);
    const data = await paymentMethodService.create(payload);
    res.status(201).json({
      message: "Tao phuong thuc thanh toan thanh cong",
      ...data,
    });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const payload = updateMethodSchema.parse(req.body);
    const data = await paymentMethodService.update(String(req.params.id || ""), payload);
    res.json({
      message: "Cap nhat phuong thuc thanh toan thanh cong",
      ...data,
    });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const data = await paymentMethodService.remove(String(req.params.id || ""));
    res.json({
      message: "Xoa phuong thuc thanh toan thanh cong",
      ...data,
    });
  }),
};
