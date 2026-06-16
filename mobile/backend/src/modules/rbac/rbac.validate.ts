import { z } from "zod";

export const roleCodeParamsSchema = z.object({
  roleCode: z.string().trim().min(1, "roleCode là bắt buộc"),
});

export const createRoleSchema = z.object({
  code: z.string().trim().min(1, "Mã vai trò là bắt buộc"),
  name: z.string().trim().min(1, "Tên vai trò là bắt buộc"),
  description: z.string().trim().optional().default(""),
  isActive: z.boolean().optional().default(true),
});

export const updateRoleSchema = z.object({
  name: z.string().trim().min(1, "Tên vai trò là bắt buộc").optional(),
  description: z.string().trim().optional().default(""),
  isActive: z.boolean().optional(),
});

export const userIdParamsSchema = z.object({
  userId: z.string().trim().min(1, "userId là bắt buộc"),
});

export const setRolePermissionsSchema = z.object({
  permissions: z.array(z.string().trim().min(1)).default([]),
});

export const setUserRolesSchema = z.object({
  roles: z.array(z.string().trim().min(1)).min(1, "Phải có ít nhất 1 role"),
});
