import { ZodError } from "zod";
import type { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  // Zod validate
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation error",
      errors: err.flatten().fieldErrors,
    });
  }

  // mongoose unique duplicate
  if (err?.code === 11000) {
    return res.status(409).json({
      message: "Duplicate value",
      fields: err?.keyValue,
    });
  }

  // invalid ObjectId cast
  if (err?.name === "CastError") {
    return res.status(400).json({ message: "Invalid id" });
  }

  const status = Number(err?.statusCode || 500);
  return res.status(status).json({ message: err?.message || "Internal Server Error" });
}
