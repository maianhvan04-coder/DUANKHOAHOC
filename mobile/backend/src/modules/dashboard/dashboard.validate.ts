import { z } from "zod";

export const getDashboardSchema = z.object({
  query: z.object({
    months: z.coerce.number().int().min(3).max(12).optional().default(6),
  }),
});