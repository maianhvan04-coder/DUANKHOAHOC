import type { NextFunction, Request, Response } from "express";
import { getDashboardService } from "./dashboard.service";

export async function getDashboardController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const months = Number(req.query.months || 6);

    const data = await getDashboardService({
      months,
    });

    return res.json({
      ok: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}