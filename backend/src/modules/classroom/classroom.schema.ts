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

const nonNegativeNumberSchema = z.preprocess(
  (value) => {
    const normalized = emptyToUndefined(value);
    if (normalized === undefined) return undefined;
    if (typeof normalized === "number") return normalized;
    if (typeof normalized === "string") return Number(normalized);
    return normalized;
  },
  z
    .number({ error: "Số lượng tối đa không hợp lệ" })
    .min(0, { error: "Số lượng tối đa không được âm" })
    .optional()
);

const optionalDateStringSchema = z.preprocess(
  emptyToUndefined,
  z.string().trim().optional()
);

function isValidDateInput(value?: string) {
  if (!value) return true;
  return !Number.isNaN(new Date(value).getTime());
}

function validateDateRange(
  data: { startedAt?: string; endedAt?: string },
  ctx: z.RefinementCtx
) {
  if (data.startedAt && !isValidDateInput(data.startedAt)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["startedAt"],
      message: "Ngày bắt đầu không hợp lệ",
    });
  }

  if (data.endedAt && !isValidDateInput(data.endedAt)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endedAt"],
      message: "Ngày kết thúc không hợp lệ",
    });
  }

  if (data.startedAt && data.endedAt) {
    const start = new Date(data.startedAt);
    const end = new Date(data.endedAt);

    if (
      !Number.isNaN(start.getTime()) &&
      !Number.isNaN(end.getTime()) &&
      end < start
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endedAt"],
        message: "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu",
      });
    }
  }
}

export const createClassRoomSchema = z
  .object({
    course: z.string().trim().min(1, { error: "Thiếu khóa học" }),
    teacher: z.string().trim().min(1, { error: "Thiếu giảng viên" }),
    className: z.string().trim().min(1, { error: "Thiếu tên lớp" }),
    mode: z.enum(["ONLINE", "OFFLINE"]).optional(),
    scheduleText: z.string().trim().optional(),
    room: z.string().trim().optional(),
    startedAt: optionalDateStringSchema,
    endedAt: optionalDateStringSchema,
    maxStudents: nonNegativeNumberSchema,
    isActive: booleanLikeSchema,
  })
  .superRefine(validateDateRange)
  .strict();

export const updateClassRoomSchema = z
  .object({
    course: z.string().trim().min(1, { error: "Khóa học không hợp lệ" }).optional(),
    teacher: z.string().trim().min(1, { error: "Giảng viên không hợp lệ" }).optional(),
    className: z.string().trim().min(1, { error: "Tên lớp không hợp lệ" }).optional(),
    mode: z.enum(["ONLINE", "OFFLINE"]).optional(),
    scheduleText: z.string().trim().optional(),
    room: z.string().trim().optional(),
    startedAt: optionalDateStringSchema,
    endedAt: optionalDateStringSchema,
    maxStudents: nonNegativeNumberSchema,
    isActive: booleanLikeSchema,
  })
  .superRefine(validateDateRange)
  .strict();

export type CreateClassRoomInput = z.infer<typeof createClassRoomSchema>;
export type UpdateClassRoomInput = z.infer<typeof updateClassRoomSchema>;