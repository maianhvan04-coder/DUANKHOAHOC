import { z } from "zod";

const pageSchema = z.coerce.number().int().min(1).default(1);
const limitSchema = z.coerce.number().int().min(1).max(100).default(10);

export const getAdminSecurityAuditsSchema = z.object({
  query: z.object({
    page: pageSchema.optional(),
    limit: limitSchema.optional(),
    keyword: z.string().trim().optional(),
    email: z.string().trim().optional(),
    path: z.string().trim().optional(),
    ipAddress: z.string().trim().optional(),
    action: z.string().trim().optional(),
    success: z.enum(["true", "false"]).optional(),
  }),
});

export const getMySecurityAuditsSchema = z.object({
  query: z.object({
    page: pageSchema.optional(),
    limit: limitSchema.optional(),
    action: z.string().trim().optional(),
    success: z.enum(["true", "false"]).optional(),
  }),
});