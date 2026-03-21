import { z } from "zod";

const optionalBoolean = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "on"].includes(normalized)) return true;
    if (["false", "0", "off"].includes(normalized)) return false;
  }

  return value;
}, z.boolean().optional());

const requiredBoolean = z.preprocess((value) => {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "on"].includes(normalized)) return true;
    if (["false", "0", "off"].includes(normalized)) return false;
  }

  return value;
}, z.boolean());

const optionalNumber = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return value;
}, z.number().min(0).max(5).optional());

export const teacherListQuerySchema = z.object({
  query: z.object({
    q: z.string().trim().optional(),
    deleted: optionalBoolean,
  }),
});

export const teacherIdParamSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1, "Thiếu id"),
  }),
});

export const createTeacherSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, "Tên ít nhất 2 ký tự"),
    email: z.string().trim().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu ít nhất 6 ký tự"),

    specialty: z.string().trim().optional().default(""),
    phone: z.string().trim().optional().default(""),

    degree: z.string().trim().optional().default(""),
    experience: z.string().trim().optional().default(""),
    achievement: z.string().trim().optional().default(""),
    bio: z.string().trim().optional().default(""),

    rating: optionalNumber,
    active: optionalBoolean,
  }),
});

export const updateTeacherSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
  }),
  body: z.object({
    name: z.string().trim().min(2).optional(),
    password: z.string().min(6).optional(),

    specialty: z.string().trim().optional(),
    phone: z.string().trim().optional(),

    degree: z.string().trim().optional(),
    experience: z.string().trim().optional(),
    achievement: z.string().trim().optional(),
    bio: z.string().trim().optional(),

    rating: optionalNumber,
    active: optionalBoolean,
  }),
});

export const teacherStatusSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
  }),
  body: z.object({
    active: requiredBoolean,
  }),
});