import { z } from "zod";

export const aiMessageSchema = z
  .object({
    body: z
      .object({
        message: z
          .string()
          .trim()
          .min(1, "Vui long nhap cau hoi")
          .max(1200, "Cau hoi qua dai"),
        history: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string().trim().min(1).max(1600),
            })
          )
          .max(8)
          .optional(),
      })
      .strict(),
  })
  .passthrough();

export const aiNotificationDraftSchema = z
  .object({
    body: z
      .object({
        prompt: z
          .string()
          .trim()
          .min(1, "Vui long nhap yeu cau soan thong bao")
          .max(800, "Yeu cau qua dai"),
      })
      .strict(),
  })
  .passthrough();
