import { isValidObjectId, Types } from "mongoose";
import { classRoomRepository } from "./classroom.repository";
import { ProductModel } from "../course/course.model";
import { TeacherModel } from "../teacher/teacher.model";
import { studentStudyService } from "../student/service/student-study.service";

function toObjectId(id: string, message = "ID không hợp lệ") {
  if (!isValidObjectId(id)) {
    throw new Error(message);
  }

  return new Types.ObjectId(id);
}

function toBoolean(value: unknown, fallback = true) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function toNumber(value: unknown, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

async function ensureCourse(courseId: string) {
  if (!isValidObjectId(courseId)) {
    throw new Error("Khóa học không hợp lệ");
  }

  const course = await ProductModel.findOne({
    _id: courseId,
    isDeleted: false,
  });

  if (!course) {
    throw new Error("Khóa học không tồn tại");
  }

  return course;
}

async function ensureTeacher(teacherId: string) {
  if (!isValidObjectId(teacherId)) {
    throw new Error("Giảng viên không hợp lệ");
  }

  const teacher = await TeacherModel.findById(teacherId);

  if (!teacher) {
    throw new Error("Giảng viên không tồn tại");
  }

  return teacher;
}

type CreateClassRoomPayload = {
  course: string;
  teacher: string;
  className: string;
  mode?: "ONLINE" | "OFFLINE";
  scheduleText?: string;
  room?: string;
  startedAt?: string;
  endedAt?: string;
  maxStudents?: string | number;
  isActive?: boolean | "true" | "false";
};

type UpdateClassRoomPayload = Partial<CreateClassRoomPayload>;

export const classRoomService = {
  async getAll(query: {
    courseId?: string;
    teacherId?: string;
    isActive?: string;
  }) {
    return classRoomRepository.findAll(query);
  },

  async getDeleted() {
    return classRoomRepository.findDeleted();
  },

  async getById(id: string) {
    const item = await classRoomRepository.findById(id);

    if (!item) {
      throw new Error("Không tìm thấy lớp học");
    }

    return item;
  },

  async create(payload: CreateClassRoomPayload) {
    await ensureCourse(payload.course);
    await ensureTeacher(payload.teacher);

    const className = payload.className.trim();

    const exists = await classRoomRepository.findDuplicate(payload.course, className);

    if (exists) {
      throw new Error("Lớp học đã tồn tại trong khóa học này");
    }

    const created = await classRoomRepository.create({
      course: toObjectId(payload.course, "Khóa học không hợp lệ"),
      teacher: toObjectId(payload.teacher, "Giảng viên không hợp lệ"),
      className,
      mode: payload.mode || "ONLINE",
      scheduleText: payload.scheduleText?.trim() || "",
      room: payload.room?.trim() || "",
      startedAt: payload.startedAt ? new Date(payload.startedAt) : null,
      endedAt: payload.endedAt ? new Date(payload.endedAt) : null,
      maxStudents: Math.max(0, toNumber(payload.maxStudents, 0)),
      isActive: toBoolean(payload.isActive, true),
    });

    const item = await classRoomRepository.findById(String(created._id));

    if (!item) {
      throw new Error("Tạo lớp học thất bại");
    }

    return item;
  },

  async update(id: string, payload: UpdateClassRoomPayload) {
    const current = await classRoomRepository.findById(id);

    if (!current) {
      throw new Error("Không tìm thấy lớp học");
    }

    const updateData: {
      course?: Types.ObjectId;
      teacher?: Types.ObjectId;
      className?: string;
      mode?: "ONLINE" | "OFFLINE";
      scheduleText?: string;
      room?: string;
      startedAt?: Date | null;
      endedAt?: Date | null;
      maxStudents?: number;
      isActive?: boolean;
    } = {};

    const nextCourseId =
      payload.course !== undefined
        ? payload.course
        : typeof current.course === "object" && current.course?._id
          ? String(current.course._id)
          : String(current.course);

    const nextClassName =
      payload.className !== undefined
        ? payload.className.trim()
        : current.className;

    if (payload.course !== undefined) {
      await ensureCourse(payload.course);
      updateData.course = toObjectId(payload.course, "Khóa học không hợp lệ");
    }

    if (payload.teacher !== undefined) {
      await ensureTeacher(payload.teacher);
      updateData.teacher = toObjectId(payload.teacher, "Giảng viên không hợp lệ");
    }

    if (payload.className !== undefined) {
      updateData.className = payload.className.trim();
    }

    const duplicate = await classRoomRepository.findDuplicateExcludeId(
      nextCourseId,
      nextClassName,
      id
    );

    if (duplicate) {
      throw new Error("Lớp học đã tồn tại trong khóa học này");
    }

    if (payload.mode !== undefined) {
      updateData.mode = payload.mode;
    }

    if (payload.scheduleText !== undefined) {
      updateData.scheduleText = payload.scheduleText.trim();
    }

    if (payload.room !== undefined) {
      updateData.room = payload.room.trim();
    }

    if (payload.startedAt !== undefined) {
      updateData.startedAt = payload.startedAt ? new Date(payload.startedAt) : null;
    }

    if (payload.endedAt !== undefined) {
      updateData.endedAt = payload.endedAt ? new Date(payload.endedAt) : null;
    }

    if (payload.maxStudents !== undefined) {
      updateData.maxStudents = Math.max(0, toNumber(payload.maxStudents, 0));
    }

    if (payload.isActive !== undefined) {
      updateData.isActive = toBoolean(payload.isActive, true);
    }

    const updated = await classRoomRepository.updateById(id, updateData);

    if (!updated) {
      throw new Error("Cập nhật lớp học thất bại");
    }

    await studentStudyService.syncSnapshotByClassRoom(id);

    return updated;
  },

  async softDelete(id: string) {
    const item = await classRoomRepository.findById(id);

    if (!item) {
      throw new Error("Không tìm thấy lớp học");
    }

    const deleted = await classRoomRepository.softDeleteById(id);

    if (!deleted) {
      throw new Error("Không tìm thấy lớp học");
    }

    return deleted;
  },

  async restore(id: string) {
    const item = await classRoomRepository.findDeletedById(id);

    if (!item) {
      throw new Error("Không tìm thấy lớp học đã xóa");
    }

    const courseId =
      typeof item.course === "object" && item.course?._id
        ? String(item.course._id)
        : String(item.course);

    const exists = await classRoomRepository.findDuplicate(courseId, item.className);

    if (exists) {
      throw new Error("Lớp học đã bị dùng bởi dữ liệu khác, không thể khôi phục");
    }

    const restored = await classRoomRepository.restoreById(id);

    if (!restored) {
      throw new Error("Khôi phục lớp học thất bại");
    }

    return restored;
  },

  async forceDelete(id: string) {
    const item = await classRoomRepository.findAnyById(id);

    if (!item) {
      throw new Error("Không tìm thấy lớp học");
    }

    const deleted = await classRoomRepository.forceDeleteById(id);

    if (!deleted) {
      throw new Error("Không tìm thấy lớp học");
    }

    return deleted;
  },
};