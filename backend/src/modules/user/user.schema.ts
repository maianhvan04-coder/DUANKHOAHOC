import { z } from "zod";
import { ROLES } from "../../constants/roles";

const roleEnum = z.enum([
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.TEACHER,
  ROLES.STUDENT,
  ROLES.USER,
]);

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Tên không được để trống"),
  email: z.string().trim().email("Email không hợp lệ"),
  role: roleEnum.optional(),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1, "Tên không được để trống").optional(),
    email: z.string().trim().email("Email không hợp lệ").optional(),
    role: roleEnum.optional(),
  })
  .refine((v) => v.name !== undefined || v.email !== undefined || v.role !== undefined, {
    message: "Phải có ít nhất một trường để cập nhật",
  });