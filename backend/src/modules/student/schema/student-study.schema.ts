import { z } from "zod";

const emptyToUndefined = (value: unknown) => {
  if (value === "" || value === null) return undefined;
  return value;
};

const booleanLikeSchema = z.preprocess(
  (value) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  },
  z.boolean().optional()
);

const percentNumberSchema = z.preprocess(
  (value) => {
    const normalized = emptyToUndefined(value);
    if (normalized === undefined) return undefined;
    if (typeof normalized === "number") return normalized;
    if (typeof normalized === "string") return Number(normalized);
    return normalized;
  },
  z.number().min(0).max(100).optional()
);

const testScoreSchema = z.preprocess(
  (value) => {
    const normalized = emptyToUndefined(value);
    if (normalized === undefined) return undefined;
    if (typeof normalized === "number") return normalized;
    if (typeof normalized === "string") return Number(normalized);
    return normalized;
  },
  z.number().min(0).max(10).optional()
);

const optionalDateStringSchema = z.preprocess(
  emptyToUndefined,
  z.string().trim().nullable().optional()
);

export const createStudentStudySchema = z
  .object({
    classRoom: z.string().trim().min(1, "Thiếu lớp học"),
    status: z
      .enum(["ENROLLED", "STUDYING", "PAUSED", "COMPLETED", "DROPPED"])
      .optional(),
    note: z.string().trim().optional(),
    isActive: booleanLikeSchema,
  })
  .strict();

export const updateStudentStudySchema = z
  .object({
    classRoom: z.string().trim().min(1, "Lớp học không hợp lệ").optional(),
    status: z
      .enum(["ENROLLED", "STUDYING", "PAUSED", "COMPLETED", "DROPPED"])
      .optional(),
    note: z.string().trim().optional(),
    isActive: booleanLikeSchema,
  })
  .strict();

export const updateStudentStudyLearningSchema = z
  .object({
    score: percentNumberSchema,
    progressPercent: percentNumberSchema,
    attendancePercent: percentNumberSchema,
    status: z
      .enum(["ENROLLED", "STUDYING", "PAUSED", "COMPLETED", "DROPPED"])
      .optional(),
  })
  .strict();

export const updateStudentStudySessionSchema = z
  .object({
    sessionNo: z.number().int().min(1).max(30),
    date: optionalDateStringSchema,
    attendanceStatus: z.enum(["PRESENT", "LATE", "ABSENT"]).optional(),
    homeworkStatus: z.enum(["DONE", "MISSING"]).optional(),
    teacherNote: z.string().trim().optional(),
    progressScore: percentNumberSchema,
  })
  .strict();

export const updateStudentStudyTestsSchema = z
  .object({
    test1: testScoreSchema,
    test2: testScoreSchema,
    test3: testScoreSchema,
  })
  .strict();

export const updateStudentStudyHonorSchema = z
  .object({
    isHonored: z.boolean().optional(),
    honorTitle: z.string().trim().optional(),
    showHonorOnUserPage: z.boolean().optional(),
  })
  .strict();