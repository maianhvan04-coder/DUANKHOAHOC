import type { NextFunction, Request, Response } from "express";
import {
  getAdminSecurityAuditsService,
  getMySecurityAuditsService,
} from "./security-audit.service";

function getUserId(req: Request) {
  const user: any = (req as any).user;
  return String(user?.id || user?._id || "");
}

function toPositiveNumber(value: unknown, fallback: number) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}

function toOptionalBoolean(value: unknown): boolean | undefined {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return undefined;
}

export async function getAdminSecurityAuditsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await getAdminSecurityAuditsService({
      page: toPositiveNumber(req.query.page, 1),
      limit: toPositiveNumber(req.query.limit, 10),
      keyword: typeof req.query.keyword === "string" ? req.query.keyword : undefined,
      email: typeof req.query.email === "string" ? req.query.email : undefined,
      path: typeof req.query.path === "string" ? req.query.path : undefined,
      ipAddress:
        typeof req.query.ipAddress === "string" ? req.query.ipAddress : undefined,
      action: typeof req.query.action === "string" ? req.query.action : undefined,
      success: toOptionalBoolean(req.query.success),
    });

    return res.json({
      ok: true,
      ...data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMySecurityAuditsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await getMySecurityAuditsService({
      userId: getUserId(req),
      page: toPositiveNumber(req.query.page, 1),
      limit: toPositiveNumber(req.query.limit, 10),
      action: typeof req.query.action === "string" ? req.query.action : undefined,
      success: toOptionalBoolean(req.query.success),
    });

    return res.json({
      ok: true,
      ...data,
    });
  } catch (error) {
    next(error);
  }
}