import bcrypt from "bcryptjs";
import { studentRepository } from "../repository/student.repository";
import { studentStudyRepository } from "../repository/student-study.repository";

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
  async list() {
    return studentRepository.findAll();
  },

  async listDeleted() {
    return studentRepository.findDeleted();
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

    const created = await studentRepository.create({
      name: payload.name.trim(),
      email,
      passwordHash,
      role: "STUDENT",
      active: payload.active ?? true,
      deletedAt: null,
    });

    const item = await studentRepository.findById(String(created._id));

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

    const updateData: Partial<{
      name: string;
      email: string;
      passwordHash: string;
      active: boolean;
    }> = {};

    if (payload.name !== undefined) {
      updateData.name = payload.name.trim();
    }

    if (payload.email !== undefined) {
      const email = normalizeEmail(payload.email);
      const existed = await studentRepository.findByEmail(email);

      if (existed && String(existed._id) !== id) {
        throw new Error("Email đã tồn tại");
      }

      updateData.email = email;
    }

    if (payload.password !== undefined && payload.password.trim()) {
      updateData.passwordHash = await bcrypt.hash(payload.password, 10);
    }

    if (payload.active !== undefined) {
      updateData.active = payload.active;
    }

    const updated = await studentRepository.updateById(id, updateData);

    if (!updated) {
      throw new Error("Không tìm thấy học viên");
    }

    return updated;
  },

  async setActive(id: string, active: boolean) {
    const item = await studentRepository.setActive(id, active);

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

    const deleted = await studentRepository.softDeleteById(id);

    if (!deleted) {
      throw new Error("Không tìm thấy học viên");
    }

    await studentStudyRepository.deactivateByStudent(id);

    return deleted;
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

    const restored = await studentRepository.restoreById(id);

    if (!restored) {
      throw new Error("Khôi phục thất bại");
    }

    await studentStudyRepository.reactivateByStudent(id);

    return restored;
  },

  async forceDelete(id: string) {
    const item = await studentRepository.findAnyById(id);

    if (!item) {
      throw new Error("Không tìm thấy học viên");
    }

    await studentStudyRepository.deleteByStudent(id);

    const deleted = await studentRepository.forceDeleteById(id);

    if (!deleted) {
      throw new Error("Không tìm thấy học viên");
    }

    return deleted;
  },
};