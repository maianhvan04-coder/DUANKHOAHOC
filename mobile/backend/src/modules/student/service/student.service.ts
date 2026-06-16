import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { studentRepository } from "../repository/student.repository";
import { studentStudyRepository } from "../repository/student-study.repository";
import type { ListQueryInput } from "../../../utils/list-query";

type CreateStudentPayload = {
  name: string;
  email: string;
  password: string;
  active?: boolean;
};

type UpdateStudentPayload = Partial<{
  name: string;
  email: string;
  password: string;
  active: boolean;
}>;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export const studentService = {
  async list(query: ListQueryInput = {}) {
    return studentRepository.findAll(query);
  },

  async listDeleted(query: ListQueryInput = {}) {
    return studentRepository.findDeleted(query);
  },

  async getById(id: string) {
    const item = await studentRepository.findById(id);

    if (!item) {
      throw new Error("Không tìm thấy học viên");
    }

    return item;
  },

  async create(payload: CreateStudentPayload) {
    const email = normalizeEmail(payload.email);
    const existed = await studentRepository.findByEmail(email);

    if (existed) {
      throw new Error("Email đã tồn tại");
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const active = payload.active ?? true;
    const session = await mongoose.startSession();
    let userId = "";

    try {
      await session.withTransaction(async () => {
        const user = await studentRepository.createUser(
          {
            name: payload.name.trim(),
            email,
            passwordHash,
            active,
          },
          session
        );

        userId = String(user._id);
        await studentRepository.createStudent(
          userId,
          {
            name: payload.name.trim(),
            email,
            active,
          },
          session
        );
      });
    } finally {
      await session.endSession();
    }

    const item = await studentRepository.findById(userId);
    if (!item) {
      throw new Error("Tạo học viên thất bại");
    }

    return item;
  },

  async update(id: string, payload: UpdateStudentPayload) {
    const current = await studentRepository.findById(id);

    if (!current) {
      throw new Error("Không tìm thấy học viên");
    }

    const userUpdate: Partial<{
      name: string;
      email: string;
      passwordHash: string;
      active: boolean;
    }> = {};

    if (payload.name !== undefined) {
      userUpdate.name = payload.name.trim();
    }

    if (payload.email !== undefined) {
      const email = normalizeEmail(payload.email);
      const existed = await studentRepository.findByEmail(email);

      if (existed && String(existed._id) !== id) {
        throw new Error("Email đã tồn tại");
      }

      userUpdate.email = email;
    }

    if (payload.password !== undefined && payload.password.trim()) {
      userUpdate.passwordHash = await bcrypt.hash(payload.password, 10);
    }

    if (payload.active !== undefined) {
      userUpdate.active = payload.active;
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        await studentRepository.updateUser(id, userUpdate, session);

        if (
          payload.name !== undefined ||
          payload.email !== undefined ||
          payload.active !== undefined
        ) {
          await studentRepository.updateStudent(
            id,
            {
              ...(payload.name !== undefined
                ? { name: payload.name.trim() }
                : {}),
              ...(payload.email !== undefined
                ? { email: normalizeEmail(payload.email) }
                : {}),
              ...(payload.active !== undefined
                ? { isActive: payload.active }
                : {}),
            },
            session
          );
        }
      });
    } finally {
      await session.endSession();
    }

    const updated = await studentRepository.findById(id);
    if (!updated) {
      throw new Error("Không tìm thấy học viên");
    }

    return updated;
  },

  async setActive(id: string, active: boolean) {
    const current = await studentRepository.findById(id);
    if (!current) {
      throw new Error("Không tìm thấy học viên");
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        await studentRepository.setActive(id, active, session);
      });
    } finally {
      await session.endSession();
    }

    const item = await studentRepository.findById(id);
    if (!item) {
      throw new Error("Không tìm thấy học viên");
    }

    return item;
  },

  async softDelete(id: string) {
    const item = await studentRepository.findById(id);

    if (!item) {
      throw new Error("Không tìm thấy học viên");
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        await studentRepository.softDeleteById(id, session);
        await studentStudyRepository.deactivateByStudent(id, session);
      });
    } finally {
      await session.endSession();
    }

    return studentRepository.findDeletedById(id);
  },

  async restore(id: string) {
    const item = await studentRepository.findDeletedById(id);

    if (!item) {
      throw new Error("Không tìm thấy học viên đã xóa");
    }

    const existed = await studentRepository.findByEmail(String(item.email));

    if (existed && String(existed._id) !== id) {
      throw new Error(
        "Không thể khôi phục vì email đã được tài khoản khác sử dụng"
      );
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        await studentRepository.restoreById(id, session);
        await studentStudyRepository.reactivateByStudent(id, session);
      });
    } finally {
      await session.endSession();
    }

    const restored = await studentRepository.findById(id);
    if (!restored) {
      throw new Error("Khôi phục thất bại");
    }

    return restored;
  },

  async forceDelete(id: string) {
    const item = await studentRepository.findAnyById(id);

    if (!item) {
      throw new Error("Không tìm thấy học viên");
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        await studentStudyRepository.deleteByStudent(id, session);
        await studentRepository.forceDeleteById(id, session);
      });
    } finally {
      await session.endSession();
    }

    return item;
  },
};
