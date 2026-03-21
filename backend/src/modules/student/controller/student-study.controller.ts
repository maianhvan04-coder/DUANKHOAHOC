import type { Request, Response } from "express";
import { z } from "zod";
import { studentStudyService } from "../service/student-study.service";
import {
  createStudentStudySchema,
  updateStudentStudySchema,
  updateStudentStudyHonorSchema,
  updateStudentStudyLearningSchema,
} from "../schema/student-study.schema";

type StudentIdParams = {
  id: string;
};

type StudyIdParams = {
  studyId: string;
};

type ClassRoomIdParams = {
  classRoomId: string;
};

type StudentStudyQuery = {
  studentId?: string;
  courseId?: string;
  classRoomId?: string;
  teacherId?: string;
  mode?: string;
  status?: string;
  completionStatus?: string;
  isActive?: string;
  limit?: string;
};

export const studentStudyController = {
  async getAll(
    req: Request<Record<string, never>, unknown, unknown, StudentStudyQuery>,
    res: Response
  ) {
    try {
      const items = await studentStudyService.getAll(req.query);
      return res.json({ items });
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "Server error",
      });
    }
  },

  async getByStudent(req: Request<StudentIdParams>, res: Response) {
    try {
      const items = await studentStudyService.getByStudent(req.params.id);
      return res.json({ items });
    } catch (error: any) {
      const status =
        error.message === "Học viên không tồn tại" ? 404 : 400;

      return res.status(status).json({
        message: error.message || "Get failed",
      });
    }
  },

  async getByClassRoom(req: Request<ClassRoomIdParams>, res: Response) {
    try {
      const items = await studentStudyService.getByClassRoom(req.params.classRoomId);
      return res.json({ items });
    } catch (error: any) {
      const status =
        error.message === "Lớp học không tồn tại" ? 404 : 400;

      return res.status(status).json({
        message: error.message || "Get failed",
      });
    }
  },

  async createForStudent(req: Request<StudentIdParams>, res: Response) {
    try {
      const payload = createStudentStudySchema.parse(req.body);

      const item = await studentStudyService.create({
        ...payload,
        student: req.params.id,
      });

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

  async update(req: Request<StudyIdParams>, res: Response) {
    try {
      const payload = updateStudentStudySchema.parse(req.body);
      const item = await studentStudyService.update(req.params.studyId, payload);
      return res.json({ item });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message || "Dữ liệu không hợp lệ",
        });
      }

      const status =
        error.message === "Không tìm thấy dữ liệu học tập" ? 404 : 400;

      return res.status(status).json({
        message: error.message || "Update failed",
      });
    }
  },

  async updateLearning(req: Request<StudyIdParams>, res: Response) {
    try {
      const payload = updateStudentStudyLearningSchema.parse(req.body);
      const item = await studentStudyService.updateLearning(
        req.params.studyId,
        payload
      );
      return res.json({ item });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message || "Dữ liệu không hợp lệ",
        });
      }

      const status =
        error.message === "Không tìm thấy dữ liệu học tập" ? 404 : 400;

      return res.status(status).json({
        message: error.message || "Update learning failed",
      });
    }
  },

  async updateHonor(req: Request<StudyIdParams>, res: Response) {
    try {
      const payload = updateStudentStudyHonorSchema.parse(req.body);
      const item = await studentStudyService.updateHonor(
        req.params.studyId,
        payload
      );
      return res.json({ item });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message || "Dữ liệu không hợp lệ",
        });
      }

      const status =
        error.message === "Không tìm thấy dữ liệu học tập" ? 404 : 400;

      return res.status(status).json({
        message: error.message || "Update honor failed",
      });
    }
  },

  async remove(req: Request<StudyIdParams>, res: Response) {
    try {
      await studentStudyService.remove(req.params.studyId);
      return res.json({ message: "Xóa dữ liệu học tập thành công" });
    } catch (error: any) {
      const status =
        error.message === "Không tìm thấy dữ liệu học tập" ? 404 : 400;

      return res.status(status).json({
        message: error.message || "Delete failed",
      });
    }
  },

  async getPublicHonors(
    req: Request<Record<string, never>, unknown, unknown, StudentStudyQuery>,
    res: Response
  ) {
    try {
      const items = await studentStudyService.getPublicHonors(req.query.limit);
      return res.json({ items });
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "Server error",
      });
    }
  },
};