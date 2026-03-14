// src/modules/auth/auth.validation.ts
import { z } from "zod";
import { REFRESH_COOKIE_NAME } from "../../helpers/auth.cookie";

// helper: biến undefined/null -> "" để .min(1, "...") ra message "bắt buộc"
const reqText = (requiredMsg: string) =>
  z.preprocess(
    (v) => (v === undefined || v === null ? "" : v),
    z.string().trim().min(1, requiredMsg)
  );

// ===== SCHEMAS =====
const nameSchema = z.preprocess(
  (v) => (v === undefined || v === null ? "" : v),
  z
    .string()
    .trim()
    .min(1, "Họ tên là bắt buộc")
    .min(2, "Họ tên tối thiểu 2 ký tự")
    .max(60, "Họ tên tối đa 60 ký tự")
);

const emailSchema = z.preprocess(
  (v) => (v === undefined || v === null ? "" : v),
  z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email là bắt buộc")
    .email("Email không hợp lệ")
);

const passwordSchema = z.preprocess(
  (v) => (v === undefined || v === null ? "" : v),
  z
    .string()
    .min(1, "Mật khẩu là bắt buộc")
    .min(6, "Mật khẩu tối thiểu 6 ký tự")
    .max(64, "Mật khẩu tối đa 64 ký tự")
);

const confirmPasswordSchema = reqText("Vui lòng nhập lại mật khẩu");

const refreshTokenSchema = z.preprocess(
  (v) => (v === undefined || v === null ? "" : v),
  z.string().trim().min(10, "refreshToken không hợp lệ")
);

export const authSchemas = {
  // POST /auth/register
  register: z
    .object({
      body: z.object({
        name: nameSchema,
        email: emailSchema,
        password: passwordSchema,
        confirmPassword: confirmPasswordSchema,
      }),
    })
    .refine((d) => d.body.password === d.body.confirmPassword, {
      path: ["body", "confirmPassword"],
      message: "Mật khẩu nhập lại không khớp",
    }),

  // POST /auth/login (email + password)
  login: z.object({
    body: z.object({
      email: emailSchema,
      password: passwordSchema,
    }),
  }),

  // POST /auth/refresh
  // - ưu tiên cookie [REFRESH_COOKIE_NAME] (vd: rt)
  // - vẫn cho body.refreshToken để test Postman
  refresh: z
    .object({
      cookies: z.object({}).passthrough().optional(), // ✅ cho phép key động (rt)
      body: z
        .object({
          refreshToken: refreshTokenSchema.optional(),
        })
        .optional(),
    })
    .refine((d) => {
      const cookieRt = (d.cookies as any)?.[REFRESH_COOKIE_NAME];
      const bodyRt = d.body?.refreshToken;
      return Boolean(cookieRt || bodyRt);
    }, {
      path: ["cookies", REFRESH_COOKIE_NAME],
      message: "Thiếu refreshToken",
    }),

  // POST /auth/logout
  // cookie có thể có hoặc không (để logout idempotent)
  logout: z.object({
    cookies: z.object({}).passthrough().optional(),
  }),
};
