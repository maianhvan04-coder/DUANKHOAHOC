//src/middlewares/validate.ts

import type { NextFunction, Request, RequestHandler, Response } from "express";
import { z, ZodError } from "zod";

type HttpError = Error & { statusCode?: number; errors?: any };

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
  body: any;
  query: any;
  params: any;
  cookies: any;
  headers: any;
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

    if (!result.success) return next(toBadRequest(result.error));

    const data = result.data as ParsedReq;

    if (data.body !== undefined) (req as any).body = data.body;
    if (data.query !== undefined) (req as any).query = data.query;
    if (data.params !== undefined) (req as any).params = data.params;

    return next();
  };
};
