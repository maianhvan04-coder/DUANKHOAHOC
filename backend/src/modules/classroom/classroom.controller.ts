import type { Request, Response } from "express";
import { z } from "zod";
import { classRoomService } from "./classroom.service";
import {
  createClassRoomSchema,
  updateClassRoomSchema,
} from "./classroom.schema";
import { studentStudyService } from "../student/service/student-study.service";

type ClassRoomParams = {
  id: string;
};

type ClassRoomQuery = {
  courseId?: string;
  teacherId?: string;
  isActive?: string;
};

export const classRoomController = {
  async getAll(
    req: Request<Record<string, never>, unknown, unknown, ClassRoomQuery>,
    res: Response
  ) {
    try {
      const items = await classRoomService.getAll(req.query);
      return res.json({ items });
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "Server error",
      });
    }
  },

  async getDeleted(_req: Request, res: Response) {
    try {
      const items = await classRoomService.getDeleted();
      return res.json({ items });
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "Server error",
      });
    }
  },

  async getById(req: Request<ClassRoomParams>, res: Response) {
    try {
      const item = await classRoomService.getById(req.params.id);
      return res.json({ item });
    } catch (error: any) {
      const status = error.message === "Không tìm thấy lớp học" ? 404 : 400;
      return res.status(status).json({
        message: error.message || "Get failed",
      });
    }
  },

  async getStudents(req: Request<ClassRoomParams>, res: Response) {
    try {
      const items = await studentStudyService.getByClassRoom(req.params.id);
      return res.json({ items });
    } catch (error: any) {
      const status = error.message === "Lớp học không tồn tại" ? 404 : 400;
      return res.status(status).json({
        message: error.message || "Get students failed",
      });
    }
  },

  async create(req: Request<Record<string, never>>, res: Response) {
    try {
      const payload = createClassRoomSchema.parse(req.body);
      const item = await classRoomService.create(payload);
      return res.status(201).json({ item });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message || "Dữ liệu không hợp lệ",
        });
      }

      return res.status(400).json({
        message: error.message || "Create failed",
      });
    }
  },

  async update(req: Request<ClassRoomParams>, res: Response) {
    try {
      const payload = updateClassRoomSchema.parse(req.body);
      const item = await classRoomService.update(req.params.id, payload);
      return res.json({ item });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message || "Dữ liệu không hợp lệ",
        });
      }

      const status = error.message === "Không tìm thấy lớp học" ? 404 : 400;
      return res.status(status).json({
        message: error.message || "Update failed",
      });
    }
  },

  async softDelete(req: Request<ClassRoomParams>, res: Response) {
    try {
      await classRoomService.softDelete(req.params.id);
      return res.json({ message: "Xóa mềm lớp học thành công" });
    } catch (error: any) {
      const status = error.message === "Không tìm thấy lớp học" ? 404 : 400;
      return res.status(status).json({
        message: error.message || "Soft delete failed",
      });
    }
  },

  async restore(req: Request<ClassRoomParams>, res: Response) {
    try {
      const item = await classRoomService.restore(req.params.id);
      return res.json({
        message: "Khôi phục lớp học thành công",
        item,
      });
    } catch (error: any) {
      const status =
        error.message === "Không tìm thấy lớp học đã xóa" ? 404 : 400;

      return res.status(status).json({
        message: error.message || "Restore failed",
      });
    }
  },

  async forceDelete(req: Request<ClassRoomParams>, res: Response) {
    try {
      await classRoomService.forceDelete(req.params.id);
      return res.json({ message: "Xóa cứng lớp học thành công" });
    } catch (error: any) {
      const status = error.message === "Không tìm thấy lớp học" ? 404 : 400;
      return res.status(status).json({
        message: error.message || "Force delete failed",
      });
    }
  },
};