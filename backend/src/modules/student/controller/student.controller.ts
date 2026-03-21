import type { Request, Response } from "express";
import { z } from "zod";
import { studentService } from "../service/student.service";
import { studentStudyService } from "../service/student-study.service";
import {
  createStudentSchema,
  setStudentActiveSchema,
  updateStudentSchema,
} from "../schema/student.schema";

type IdParams = {
  id: string;
};

export const studentController = {
  async getAll(_req: Request, res: Response) {
    try {
      const items = await studentService.list();
      return res.json({ items });
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "Server error",
      });
    }
  },

  async getDeleted(_req: Request, res: Response) {
    try {
      const items = await studentService.listDeleted();
      return res.json({ items });
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "Server error",
      });
    }
  },

  async getById(req: Request<IdParams>, res: Response) {
    try {
      const item = await studentService.getById(req.params.id);
      const studies = await studentStudyService.getByStudent(req.params.id);

      return res.json({
        item: {
          ...item,
          studies,
        },
      });
    } catch (error: any) {
      const status = error.message === "Không tìm thấy học viên" ? 404 : 400;

      return res.status(status).json({
        message: error.message || "Get failed",
      });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const payload = createStudentSchema.parse(req.body);
      const item = await studentService.create(payload);
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

  async update(req: Request<IdParams>, res: Response) {
    try {
      const payload = updateStudentSchema.parse(req.body);
      const item = await studentService.update(req.params.id, payload);

      return res.json({ item });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message || "Dữ liệu không hợp lệ",
        });
      }

      const status = error.message === "Không tìm thấy học viên" ? 404 : 400;

      return res.status(status).json({
        message: error.message || "Update failed",
      });
    }
  },

  async setActive(req: Request<IdParams>, res: Response) {
    try {
      const payload = setStudentActiveSchema.parse(req.body);
      const item = await studentService.setActive(req.params.id, payload.active);

      return res.json({
        message: payload.active
          ? "Mở hoạt động học viên thành công"
          : "Khóa hoạt động học viên thành công",
        item,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message || "Dữ liệu không hợp lệ",
        });
      }

      const status = error.message === "Không tìm thấy học viên" ? 404 : 400;

      return res.status(status).json({
        message: error.message || "Update failed",
      });
    }
  },

  async softDelete(req: Request<IdParams>, res: Response) {
    try {
      await studentService.softDelete(req.params.id);

      return res.json({
        message: "Xóa mềm học viên thành công",
      });
    } catch (error: any) {
      const status = error.message === "Không tìm thấy học viên" ? 404 : 400;

      return res.status(status).json({
        message: error.message || "Soft delete failed",
      });
    }
  },

  async restore(req: Request<IdParams>, res: Response) {
    try {
      const item = await studentService.restore(req.params.id);

      return res.json({
        message: "Khôi phục học viên thành công",
        item,
      });
    } catch (error: any) {
      const status =
        error.message === "Không tìm thấy học viên đã xóa" ? 404 : 400;

      return res.status(status).json({
        message: error.message || "Restore failed",
      });
    }
  },

  async forceDelete(req: Request<IdParams>, res: Response) {
    try {
      await studentService.forceDelete(req.params.id);

      return res.json({
        message: "Xóa cứng học viên thành công",
      });
    } catch (error: any) {
      const status = error.message === "Không tìm thấy học viên" ? 404 : 400;

      return res.status(status).json({
        message: error.message || "Force delete failed",
      });
    }
  },
};