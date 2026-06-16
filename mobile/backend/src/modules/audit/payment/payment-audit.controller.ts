import type { NextFunction, Request, Response } from "express";
import {
  getAdminPaymentHistoryDetailService,
  getAdminPaymentHistoryService,
  getMyPaymentHistoryDetailService,
  getMyPaymentHistoryService,
} from "./payment-audit.service";

function getUserId(req: Request) {
  const user: any = (req as any).user;
  return String(user?.id || user?._id || "");
}

export async function getMyPaymentHistoryController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = getUserId(req);
    const data = await getMyPaymentHistoryService(userId, req.query as any);

    return res.json({
      ok: true,
      items: data.items,
      pagination: data.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyPaymentHistoryDetailController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = getUserId(req);
    const paymentCode = Number(req.params.paymentCode);

    const item = await getMyPaymentHistoryDetailService(userId, paymentCode);

    if (!item) {
      return res.status(404).json({
        message: "Không tìm thấy đơn thanh toán",
      });
    }

    return res.json({
      ok: true,
      item,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminPaymentHistoryController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await getAdminPaymentHistoryService(req.query as any);

    return res.json({
      ok: true,
      items: data.items,
      pagination: data.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminPaymentHistoryDetailController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const paymentCode = Number(req.params.paymentCode);

    const item = await getAdminPaymentHistoryDetailService(paymentCode);

    if (!item) {
      return res.status(404).json({
        message: "Không tìm thấy đơn thanh toán",
      });
    }

    return res.json({
      ok: true,
      item,
    });
  } catch (error) {
    next(error);
  }
}