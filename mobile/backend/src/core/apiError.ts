// src/core/apiError.ts

export default class ApiError extends Error {
  statusCode: number;
  details: unknown;
  code: string | null;

  /**
   * @param statusCode HTTP status
   * @param message human readable message
   * @param details optional extra info (array/object)
   * @param code optional business code, ví dụ OUT_OF_STOCK
   */
  constructor(
    statusCode: number,
    message: string,
    details: unknown = null,
    code: string | null = null
  ) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.code = code;

    // giữ stacktrace sạch
    Error.captureStackTrace?.(this, this.constructor);
  }
}