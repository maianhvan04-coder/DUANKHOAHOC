import { z } from "zod";

export const roleCodeParamsSchema = z.object({
  roleCode: z.string().trim().min(1, "roleCode là bắt buộc"),
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