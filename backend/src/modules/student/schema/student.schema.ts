import { z } from "zod";

export const createStudentSchema = z.object({
  name: z.string().trim().min(2, "Tên phải có ít nhất 2 ký tự"),
  email: z.string().trim().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  active: z.boolean().optional(),
});

export const updateStudentSchema = z.object({
  name: z.string().trim().min(2, "Tên phải có ít nhất 2 ký tự").optional(),
  email: z.string().trim().email("Email không hợp lệ").optional(),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự").optional(),
  active: z.boolean().optional(),
});

export const setStudentActiveSchema = z.object({
  active: z.boolean(),
});