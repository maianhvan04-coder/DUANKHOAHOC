import { z } from "zod";

export const createStudentStudySchema = z.object({
  classRoom: z.string().trim().min(1, "Thiếu lớp học"),
  status: z
    .enum(["ENROLLED", "STUDYING", "PAUSED", "COMPLETED", "DROPPED"])
    .optional(),
  note: z.string().trim().optional(),
  isActive: z.union([z.boolean(), z.literal("true"), z.literal("false")]).optional(),
});

export const updateStudentStudySchema = z.object({
  classRoom: z.string().trim().optional(),
  status: z
    .enum(["ENROLLED", "STUDYING", "PAUSED", "COMPLETED", "DROPPED"])
    .optional(),
  note: z.string().trim().optional(),
  isActive: z.union([z.boolean(), z.literal("true"), z.literal("false")]).optional(),
});

export const updateStudentStudyLearningSchema = z.object({
  score: z.union([z.number(), z.string()]).optional(),
  progressPercent: z.union([z.number(), z.string()]).optional(),
  attendancePercent: z.union([z.number(), z.string()]).optional(),
  status: z
    .enum(["ENROLLED", "STUDYING", "PAUSED", "COMPLETED", "DROPPED"])
    .optional(),
});

export const updateStudentStudyHonorSchema = z.object({
  isHonored: z.boolean().optional(),
  honorTitle: z.string().trim().optional(),
  showHonorOnUserPage: z.boolean().optional(),
});