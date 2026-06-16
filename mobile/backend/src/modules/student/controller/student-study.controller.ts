import type { Request, Response } from "express";
import { z } from "zod";
import { studentStudyService } from "../service/student-study.service";
import {
  createStudentStudySchema,
  updateStudentStudySchema,
  updateStudentStudyHonorSchema,
  updateStudentStudyLearningSchema,
  updateStudentStudySessionSchema,
  updateStudentStudyTestsSchema,
} from "../schema/student-study.schema";

type StudentIdParams = {
  id: string;
};

type StudyIdParams = {
  studyId: string;
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

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}

export const studentStudyController = {
  async getAll(
    req: Request<Record<string, never>, unknown, unknown, StudentStudyQuery>,
    res: Response
  ) {
    try {
      const items = await studentStudyService.getAll(req.query);
      return res.json({ items });
    } catch (error) {
      return res.status(500).json({
        message: getErrorMessage(error, "Server error"),
      });
    }
  },

  async getByStudent(req: Request<StudentIdParams>, res: Response) {
    try {
      const items = await studentStudyService.getByStudent(req.params.id);
      return res.json({ items });
    } catch (error) {
      const message = getErrorMessage(error, "Get failed");
      const status = message === "Học viên không tồn tại" ? 404 : 400;

      return res.status(status).json({ message });
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
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message || "Dữ liệu không hợp lệ",
        });
      }

      return res.status(400).json({
        message: getErrorMessage(error, "Create failed"),
      });
    }
  },

  async update(req: Request<StudyIdParams>, res: Response) {
    try {
      const payload = updateStudentStudySchema.parse(req.body);
      const item = await studentStudyService.update(req.params.studyId, payload);
      return res.json({ item });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message || "Dữ liệu không hợp lệ",
        });
      }

      const message = getErrorMessage(error, "Update failed");
      const status = message === "Không tìm thấy dữ liệu học tập" ? 404 : 400;

      return res.status(status).json({ message });
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
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message || "Dữ liệu không hợp lệ",
        });
      }

      const message = getErrorMessage(error, "Update learning failed");
      const status = message === "Không tìm thấy dữ liệu học tập" ? 404 : 400;

      return res.status(status).json({ message });
    }
  },

  async updateSession(req: Request<StudyIdParams>, res: Response) {
    try {
      const payload = updateStudentStudySessionSchema.parse(req.body);
      const item = await studentStudyService.updateSession(
        req.params.studyId,
        payload
      );

      return res.json({ item });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message || "Dữ liệu không hợp lệ",
        });
      }

      const message = getErrorMessage(error, "Update session failed");
      const status =
        message === "Không tìm thấy dữ liệu học tập" ||
        message === "Buổi học không hợp lệ"
          ? 404
          : 400;

      return res.status(status).json({ message });
    }
  },

  async updateTests(req: Request<StudyIdParams>, res: Response) {
    try {
      const payload = updateStudentStudyTestsSchema.parse(req.body);
      const item = await studentStudyService.updateTests(
        req.params.studyId,
        payload
      );

      return res.json({ item });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message || "Dữ liệu không hợp lệ",
        });
      }

      const message = getErrorMessage(error, "Update tests failed");
      const status = message === "Không tìm thấy dữ liệu học tập" ? 404 : 400;

      return res.status(status).json({ message });
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
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message || "Dữ liệu không hợp lệ",
        });
      }

      const message = getErrorMessage(error, "Update honor failed");
      const status = message === "Không tìm thấy dữ liệu học tập" ? 404 : 400;

      return res.status(status).json({ message });
    }
  },

  async remove(req: Request<StudyIdParams>, res: Response) {
    try {
      await studentStudyService.remove(req.params.studyId);
      return res.json({ message: "Xóa dữ liệu học tập thành công" });
    } catch (error) {
      const message = getErrorMessage(error, "Delete failed");
      const status = message === "Không tìm thấy dữ liệu học tập" ? 404 : 400;

      return res.status(status).json({ message });
    }
  },

  async getPublicHonors(
    req: Request<Record<string, never>, unknown, unknown, StudentStudyQuery>,
    res: Response
  ) {
    try {
      const items = await studentStudyService.getPublicHonors(req.query.limit);
      return res.json({ items });
    } catch (error) {
      return res.status(500).json({
        message: getErrorMessage(error, "Server error"),
      });
    }
  },
};