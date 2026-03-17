// src/middlewares/validate.ts

import type { NextFunction, Request, RequestHandler, Response } from "express";
import { z, ZodError } from "zod";

type HttpError = Error & {
  statusCode?: number;
  errors?: Array<{ path: string; message: string }>;
};

function toBadRequest(err: ZodError): HttpError {
  const e: HttpError = new Error("Dữ liệu không hợp lệ");
  e.statusCode = 400;
  e.errors = err.issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
  }));
  return e;
}

type ParsedReq = Partial<{
  body: Record<string, unknown>;
  query: Record<string, unknown>;
  params: Record<string, unknown>;
  cookies: Record<string, unknown>;
  headers: Record<string, unknown>;
}>;

export const validate = (schema: z.ZodTypeAny): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
      cookies: (req as any).cookies,
      headers: req.headers,
    });

    if (!result.success) {
      return next(toBadRequest(result.error));
    }

    const data = result.data as ParsedReq;

    if (data.body !== undefined) {
      (req as any).body = data.body;
    }

    if (data.params !== undefined) {
      Object.assign(req.params, data.params);
    }

    if (data.query !== undefined) {
      Object.assign(req.query as Record<string, unknown>, data.query);
    }

    return next();
  };
};