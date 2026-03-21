import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { teacherRepo } from "./teacher.repo";
import type { CreateTeacherInput, UpdateTeacherInput } from "./teacher.types";
import {
  deleteFromCloudinary,
  uploadBufferToCloudinary,
} from "../../utils/cloudinary-upload";
import ApiError from "../../core/apiError";

function buildLegacyBio(payload: {
  degree?: string;
  experience?: string;
  bio?: string;
}) {
  if (payload.bio && payload.bio.trim()) return payload.bio.trim();

  const lines: string[] = [];

  if (payload.degree?.trim()) {
    lines.push(payload.degree.trim());
  }

  const expLines = String(payload.experience || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  lines.push(...expLines);

  return lines.map((line) => `- ${line}`).join("\n");
}

export const teacherService = {
  async list(query?: { q?: string; deleted?: boolean }) {
    return teacherRepo.list(query);
  },

  async listPublic(query?: { q?: string }) {
    return teacherRepo.listPublic(query);
  },

  async getById(id: string) {
    return teacherRepo.findById(id);
  },

  async create(payload: CreateTeacherInput, avatarFile?: Express.Multer.File) {
    const existed = await teacherRepo.findUserByEmail(payload.email);
    if (existed) {
      throw new ApiError(409, "Email đã tồn tại");
    }

    let uploadedAvatar:
      | {
          secure_url: string;
          public_id: string;
        }
      | null = null;

    if (avatarFile?.buffer) {
      uploadedAvatar = await uploadBufferToCloudinary(
        avatarFile.buffer,
        "teachers"
      );
    }

    const normalizedPayload: CreateTeacherInput = {
      ...payload,
      specialty: String(payload.specialty || "").trim(),
      phone: String(payload.phone || "").trim(),
      degree: String(payload.degree || "").trim(),
      experience: String(payload.experience || "").trim(),
      achievement: String(payload.achievement || "").trim(),
      bio: buildLegacyBio(payload),
    };

    const session = await mongoose.startSession();
    let teacherId = "";

    try {
      await session.withTransaction(async () => {
        const passwordHash = await bcrypt.hash(payload.password, 10);

        const user = await teacherRepo.createUser(
          normalizedPayload,
          passwordHash,
          session
        );

        const teacher = await teacherRepo.createTeacher(
          String(user._id),
          {
            ...normalizedPayload,
            avatar: uploadedAvatar?.secure_url || "",
            avatarPublicId: uploadedAvatar?.public_id || "",
          },
          session
        );

        teacherId = String(teacher._id);
      });
    } catch (error) {
      if (uploadedAvatar?.public_id) {
        try {
          await deleteFromCloudinary(uploadedAvatar.public_id);
        } catch {}
      }
      throw error;
    } finally {
      await session.endSession();
    }

    return teacherRepo.findById(teacherId);
  },

  async update(
    id: string,
    payload: UpdateTeacherInput,
    avatarFile?: Express.Multer.File
  ) {
    const current = await teacherRepo.findRawTeacherById(id);
    if (!current) {
      throw new ApiError(404, "Không tìm thấy giảng viên");
    }

    const userId = teacherRepo.getUserIdFromTeacherDoc(current);
    if (!userId) {
      throw new ApiError(400, "Giảng viên không hợp lệ");
    }

    const nextDegree =
      payload.degree !== undefined
        ? String(payload.degree || "").trim()
        : String((current as any).degree || "").trim();

    const nextExperience =
      payload.experience !== undefined
        ? String(payload.experience || "").trim()
        : String((current as any).experience || "").trim();

    const normalizedPayload: UpdateTeacherInput = {
      ...payload,
      specialty:
        payload.specialty !== undefined
          ? String(payload.specialty || "").trim()
          : undefined,
      phone:
        payload.phone !== undefined
          ? String(payload.phone || "").trim()
          : undefined,
      degree: payload.degree !== undefined ? nextDegree : undefined,
      experience: payload.experience !== undefined ? nextExperience : undefined,
      achievement:
        payload.achievement !== undefined
          ? String(payload.achievement || "").trim()
          : undefined,
      bio:
        payload.bio !== undefined ||
        payload.degree !== undefined ||
        payload.experience !== undefined
          ? buildLegacyBio({
              degree: nextDegree,
              experience: nextExperience,
              bio: payload.bio,
            })
          : undefined,
    };

    let newUploadedAvatar:
      | {
          secure_url: string;
          public_id: string;
        }
      | null = null;

    if (avatarFile?.buffer) {
      newUploadedAvatar = await uploadBufferToCloudinary(
        avatarFile.buffer,
        "teachers"
      );
    }

    const oldAvatarPublicId = String((current as any).avatarPublicId || "");
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        let passwordHash: string | undefined;

        if (payload.password) {
          passwordHash = await bcrypt.hash(payload.password, 10);
        }

        await teacherRepo.updateUser(
          userId,
          { ...normalizedPayload, passwordHash },
          session
        );

        await teacherRepo.updateTeacher(
          id,
          {
            ...normalizedPayload,
            ...(newUploadedAvatar
              ? {
                  avatar: newUploadedAvatar.secure_url,
                  avatarPublicId: newUploadedAvatar.public_id,
                }
              : {}),
          },
          session
        );
      });
    } catch (error) {
      if (newUploadedAvatar?.public_id) {
        try {
          await deleteFromCloudinary(newUploadedAvatar.public_id);
        } catch {}
      }
      throw error;
    } finally {
      await session.endSession();
    }

    if (newUploadedAvatar?.public_id && oldAvatarPublicId) {
      try {
        await deleteFromCloudinary(oldAvatarPublicId);
      } catch {}
    }

    return teacherRepo.findById(id);
  },

  async setActive(id: string, active: boolean) {
    const current = await teacherRepo.findRawTeacherById(id);
    if (!current) {
      throw new ApiError(404, "Không tìm thấy giảng viên");
    }

    const userId = teacherRepo.getUserIdFromTeacherDoc(current);
    if (!userId) {
      throw new ApiError(400, "Giảng viên không hợp lệ");
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        await teacherRepo.setActive(id, userId, active, session);
      });
    } finally {
      await session.endSession();
    }

    return teacherRepo.findById(id);
  },

  async softDelete(id: string) {
    const current = await teacherRepo.findRawTeacherById(id);
    if (!current) {
      throw new ApiError(404, "Không tìm thấy giảng viên");
    }

    const userId = teacherRepo.getUserIdFromTeacherDoc(current);
    if (!userId) {
      throw new ApiError(400, "Giảng viên không hợp lệ");
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        await teacherRepo.softDelete(id, userId, session);
      });
    } finally {
      await session.endSession();
    }

    return teacherRepo.findById(id);
  },

  async restore(id: string) {
    const current = await teacherRepo.findRawTeacherById(id);
    if (!current) {
      throw new ApiError(404, "Không tìm thấy giảng viên");
    }

    const userId = teacherRepo.getUserIdFromTeacherDoc(current);
    if (!userId) {
      throw new ApiError(400, "Giảng viên không hợp lệ");
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        await teacherRepo.restore(id, userId, session);
      });
    } finally {
      await session.endSession();
    }

    return teacherRepo.findById(id);
  },

  async hardDelete(id: string) {
    const current = await teacherRepo.findRawTeacherById(id);
    if (!current) {
      throw new ApiError(404, "Không tìm thấy giảng viên");
    }

    const userId = teacherRepo.getUserIdFromTeacherDoc(current);
    if (!userId) {
      throw new ApiError(400, "Giảng viên không hợp lệ");
    }

    const oldAvatarPublicId = String((current as any).avatarPublicId || "");
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        await teacherRepo.hardDelete(id, userId, session);
      });
    } finally {
      await session.endSession();
    }

    if (oldAvatarPublicId) {
      try {
        await deleteFromCloudinary(oldAvatarPublicId);
      } catch {}
    }

    return true;
  },
};