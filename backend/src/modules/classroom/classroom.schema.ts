import { z } from "zod";

export const createClassRoomSchema = z.object({
  course: z.string().trim().min(1, "Thiếu khóa học"),
  teacher: z.string().trim().min(1, "Thiếu giảng viên"),
  className: z.string().trim().min(1, "Thiếu tên lớp"),
  mode: z.enum(["ONLINE", "OFFLINE"]).optional(),
  scheduleText: z.string().trim().optional(),
  room: z.string().trim().optional(),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
  maxStudents: z.union([z.number(), z.string()]).optional(),
  isActive: z.union([z.boolean(), z.literal("true"), z.literal("false")]).optional(),
});

export const updateClassRoomSchema = z.object({
  course: z.string().trim().optional(),
  teacher: z.string().trim().optional(),
  className: z.string().trim().optional(),
  mode: z.enum(["ONLINE", "OFFLINE"]).optional(),
  scheduleText: z.string().trim().optional(),
  room: z.string().trim().optional(),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
  maxStudents: z.union([z.number(), z.string()]).optional(),
  isActive: z.union([z.boolean(), z.literal("true"), z.literal("false")]).optional(),
});