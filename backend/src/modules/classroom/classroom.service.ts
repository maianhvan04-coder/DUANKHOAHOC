import { isValidObjectId, Types } from "mongoose";
import { classRoomRepository } from "./classroom.repository";
import { ProductModel } from "../course/course.model";
import { TeacherModel } from "../teacher/teacher.model";
import { studentStudyService } from "../student/service/student-study.service";
import type {
  CreateClassRoomInput,
  UpdateClassRoomInput,
} from "./classroom.schema";
import {
  compareListValues,
  escapeRegex,
  getQueryString,
  makeListResponse,
  normalizeSortOrder,
  paginateArray,
  parsePagination,
  type ListQueryInput,
} from "../../utils/list-query";

function assertObjectId(id: string, message = "ID không hợp lệ") {
  if (!isValidObjectId(id)) {
    throw new Error(message);
  }
}

function toObjectId(id: string, message = "ID không hợp lệ") {
  assertObjectId(id, message);
  return new Types.ObjectId(id);
}

function toBoolean(value: unknown, fallback = true) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function toNonNegativeInt(value: unknown, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback;

  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;

  return Math.max(0, Math.trunc(num));
}

function getRefId(value: unknown) {
  if (!value) return "";

  if (typeof value === "string") return value;

  if (value instanceof Types.ObjectId) return value.toString();

  if (typeof value === "object" && "_id" in value) {
    return String((value as { _id?: unknown })._id || "");
  }

  return "";
}

// overload để TypeScript hiểu đúng kiểu trả về
function parseOptionalDate(value: unknown, label: string): Date | null;
function parseOptionalDate(
  value: unknown,
  label: string,
  mode: "null-on-empty"
): Date | null;
function parseOptionalDate(
  value: unknown,
  label: string,
  mode: "keep-undefined"
): Date | null | undefined;
function parseOptionalDate(
  value: unknown,
  label: string,
  mode: "keep-undefined" | "null-on-empty" = "null-on-empty"
) {
  if (value === undefined) {
    return mode === "keep-undefined" ? undefined : null;
  }

  if (value === null || value === "") {
    return null;
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} không hợp lệ`);
  }

  return date;
}

function validateDateRange(startedAt?: Date | null, endedAt?: Date | null) {
  if (startedAt && endedAt && endedAt < startedAt) {
    throw new Error("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu");
  }
}

async function ensureCourse(courseId: string) {
  assertObjectId(courseId, "Khóa học không hợp lệ");

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
  assertObjectId(teacherId, "Giảng viên không hợp lệ");

  const teacher = await TeacherModel.findById(teacherId);

  if (!teacher) {
    throw new Error("Giảng viên không tồn tại");
  }

  return teacher;
}

function toPlainClassRoom(item: any) {
  if (item?.toObject) return item.toObject();
  return item;
}

function getCourseTitle(item: any) {
  return String(item?.course?.title || "");
}

function getTeacherName(item: any) {
  return String(item?.teacher?.user?.name || "");
}

function filterAndSortClassRooms(
  items: any[],
  query: ListQueryInput,
  deleted: boolean
) {
  const keyword = getQueryString(query, ["q", "search", "keyword"]);
  let rows = items.map(toPlainClassRoom);

  if (keyword) {
    const regex = new RegExp(escapeRegex(keyword), "i");
    rows = rows.filter((item) =>
      [
        item.className,
        item.scheduleText,
        item.room,
        item.mode,
        getCourseTitle(item),
        getTeacherName(item),
      ].some((value) => regex.test(String(value || "")))
    );
  }

  const sortBy = getQueryString(query, ["sortBy", "sort"]);
  const sortOrder = normalizeSortOrder(query.sortOrder ?? query.order);
  const sortField = sortBy || (deleted ? "deletedAt" : "createdAt");

  return [...rows].sort((left, right) => {
    const pick = (item: any) => {
      switch (sortField) {
        case "className":
          return item.className;
        case "course":
          return getCourseTitle(item);
        case "teacher":
          return getTeacherName(item);
        case "schedule":
          return item.scheduleText;
        case "room":
          return item.room;
        case "status":
          return item.isActive;
        case "deletedAt":
          return item.deletedAt;
        case "createdAt":
        default:
          return item.createdAt;
      }
    };

    return compareListValues(pick(left), pick(right), sortOrder);
  });
}

export const classRoomService = {
  async getAll(query: ListQueryInput & {
    courseId?: string;
    teacherId?: string;
    isActive?: string;
    status?: string;
  }) {
    const items = await classRoomRepository.findAll(query);
    const sorted = filterAndSortClassRooms(items as any[], query, false);
    const pagination = parsePagination(query);
    return makeListResponse(
      paginateArray(sorted, pagination),
      sorted.length,
      pagination
    );
  },

  async getDeleted(query: ListQueryInput = {}) {
    const items = await classRoomRepository.findDeleted(query);
    const sorted = filterAndSortClassRooms(items as any[], query, true);
    const pagination = parsePagination(query);
    return makeListResponse(
      paginateArray(sorted, pagination),
      sorted.length,
      pagination
    );
  },

  async getById(id: string) {
    assertObjectId(id, "ID lớp học không hợp lệ");

    const item = await classRoomRepository.findById(id);

    if (!item) {
      throw new Error("Không tìm thấy lớp học");
    }

    return item;
  },

  async create(payload: CreateClassRoomInput) {
    await ensureCourse(payload.course);
    await ensureTeacher(payload.teacher);

    const className = payload.className.trim();
    const scheduleText = payload.scheduleText?.trim() || "";
    const room = payload.room?.trim() || "";

    const startedAt = parseOptionalDate(payload.startedAt, "Ngày bắt đầu");
    const endedAt = parseOptionalDate(payload.endedAt, "Ngày kết thúc");

    validateDateRange(startedAt, endedAt);

    const exists = await classRoomRepository.findDuplicate(
      payload.course,
      className
    );

    if (exists) {
      throw new Error("Lớp học đã tồn tại trong khóa học này");
    }

    const created = await classRoomRepository.create({
      course: toObjectId(payload.course, "Khóa học không hợp lệ"),
      teacher: toObjectId(payload.teacher, "Giảng viên không hợp lệ"),
      className,
      mode: payload.mode || "ONLINE",
      scheduleText,
      room,
      startedAt,
      endedAt,
      maxStudents: toNonNegativeInt(payload.maxStudents, 0),
      isActive: toBoolean(payload.isActive, true),
    });

    const item = await classRoomRepository.findById(String(created._id));

    if (!item) {
      throw new Error("Tạo lớp học thất bại");
    }

    return item;
  },

  async update(id: string, payload: UpdateClassRoomInput) {
    assertObjectId(id, "ID lớp học không hợp lệ");

    const current = await classRoomRepository.findById(id);

    if (!current) {
      throw new Error("Không tìm thấy lớp học");
    }

    const currentCourseId = getRefId(current.course);
    const nextCourseId = payload.course ?? currentCourseId;
    const nextClassName = payload.className?.trim() ?? current.className;

    if (payload.course !== undefined) {
      await ensureCourse(payload.course);
    }

    if (payload.teacher !== undefined) {
      await ensureTeacher(payload.teacher);
    }

    const duplicate = await classRoomRepository.findDuplicateExcludeId(
      nextCourseId,
      nextClassName,
      id
    );

    if (duplicate) {
      throw new Error("Lớp học đã tồn tại trong khóa học này");
    }

    const startedAt =
      payload.startedAt !== undefined
        ? parseOptionalDate(
            payload.startedAt,
            "Ngày bắt đầu",
            "keep-undefined"
          )
        : undefined;

    const endedAt =
      payload.endedAt !== undefined
        ? parseOptionalDate(
            payload.endedAt,
            "Ngày kết thúc",
            "keep-undefined"
          )
        : undefined;

    const effectiveStartedAt =
      startedAt !== undefined ? startedAt : current.startedAt ?? null;

    const effectiveEndedAt =
      endedAt !== undefined ? endedAt : current.endedAt ?? null;

    validateDateRange(effectiveStartedAt, effectiveEndedAt);

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

    if (payload.course !== undefined) {
      updateData.course = toObjectId(payload.course, "Khóa học không hợp lệ");
    }

    if (payload.teacher !== undefined) {
      updateData.teacher = toObjectId(
        payload.teacher,
        "Giảng viên không hợp lệ"
      );
    }

    if (payload.className !== undefined) {
      updateData.className = payload.className.trim();
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
      updateData.startedAt = startedAt ?? null;
    }

    if (payload.endedAt !== undefined) {
      updateData.endedAt = endedAt ?? null;
    }

    if (payload.maxStudents !== undefined) {
      updateData.maxStudents = toNonNegativeInt(payload.maxStudents, 0);
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
    assertObjectId(id, "ID lớp học không hợp lệ");

    const item = await classRoomRepository.findById(id);

    if (!item) {
      throw new Error("Không tìm thấy lớp học");
    }

    const deleted = await classRoomRepository.softDeleteById(id);

    if (!deleted) {
      throw new Error("Xóa mềm lớp học thất bại");
    }

    return deleted;
  },

  async restore(id: string) {
    assertObjectId(id, "ID lớp học không hợp lệ");

    const item = await classRoomRepository.findDeletedById(id);

    if (!item) {
      throw new Error("Không tìm thấy lớp học đã xóa");
    }

    const courseId = getRefId(item.course);

    const exists = await classRoomRepository.findDuplicate(
      courseId,
      item.className
    );

    if (exists) {
      throw new Error("Lớp học đã bị dùng bởi dữ liệu khác, không thể khôi phục");
    }

    const restored = await classRoomRepository.restoreById(id);

    if (!restored) {
      throw new Error("Khôi phục lớp học thất bại");
    }

    await studentStudyService.syncSnapshotByClassRoom(id);

    return restored;
  },

  async forceDelete(id: string) {
    assertObjectId(id, "ID lớp học không hợp lệ");

    const item = await classRoomRepository.findAnyById(id);

    if (!item) {
      throw new Error("Không tìm thấy lớp học");
    }

    const deleted = await classRoomRepository.forceDeleteById(id);

    if (!deleted) {
      throw new Error("Xóa cứng lớp học thất bại");
    }

    return deleted;
  },
};
