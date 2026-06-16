import { z } from "zod";

export const updateMyProfileSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, "Tên phải có ít nhất 2 ký tự")
      .max(100, "Tên không được quá 100 ký tự"),
  }),
});

export const changeMyPasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z
        .string()
        .min(6, "Mật khẩu hiện tại phải có ít nhất 6 ký tự"),
      newPassword: z
        .string()
        .min(6, "Mật khẩu mới phải có ít nhất 6 ký tự")
        .max(100, "Mật khẩu mới không được quá 100 ký tự"),
      confirmPassword: z
        .string()
        .min(6, "Xác nhận mật khẩu phải có ít nhất 6 ký tự"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      path: ["confirmPassword"],
      message: "Xác nhận mật khẩu mới không khớp",
    }),
});