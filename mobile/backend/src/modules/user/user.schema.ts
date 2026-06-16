import { z } from "zod";

const roleCodeSchema = z.string().trim().min(1, "Vai trò không được để trống");
const passwordSchema = z
  .string()
  .min(6, "Mật khẩu tối thiểu 6 ký tự")
  .max(64, "Mật khẩu tối đa 64 ký tự");

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Tên không được để trống"),
  email: z.string().trim().email("Email không hợp lệ"),
  role: roleCodeSchema.optional(),
  roles: z.array(roleCodeSchema).optional(),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1, "Tên không được để trống").optional(),
    email: z.string().trim().email("Email không hợp lệ").optional(),
    role: roleCodeSchema.optional(),
    roles: z.array(roleCodeSchema).optional(),
    password: passwordSchema.optional(),
  })
  .refine(
    (v) =>
      v.name !== undefined ||
      v.email !== undefined ||
      v.role !== undefined ||
      v.roles !== undefined ||
      v.password !== undefined,
    {
      message: "Phải có ít nhất một trường để cập nhật",
    }
  );
