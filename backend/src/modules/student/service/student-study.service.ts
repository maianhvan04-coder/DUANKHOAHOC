import { isValidObjectId, Types } from "mongoose";
import { studentStudyRepository } from "../repository/student-study.repository";
import { UserModel } from "../../user/user.model";
import { ProductModel } from "../../course/course.model";
import { TeacherModel } from "../../teacher/teacher.model";
import { ClassRoomModel } from "../../classroom/classroom.model";

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

function clampPercent(value: number) {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

function getPerformanceStatus(
  score: number
): "NORMAL" | "GOOD" | "EXCELLENT" {
  if (score >= 90) return "EXCELLENT";
  if (score >= 75) return "GOOD";
  return "NORMAL";
}

function getRefId(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;

  if (typeof value === "object" && "_id" in (value as Record<string, unknown>)) {
    return String((value as { _id?: string })._id || "");
  }

  return "";
}

function resolveCompletionFields(params: {
  status: "ENROLLED" | "STUDYING" | "PAUSED" | "COMPLETED" | "DROPPED";
  progressPercent: number;
  currentCompletedAt?: Date | null;
  currentEndedAt?: Date | null;
}) {
  let status = params.status;
  let progressPercent = clampPercent(params.progressPercent);

  let completionStatus: "NOT_COMPLETED" | "COMPLETED" = "NOT_COMPLETED";
  let completedAt: Date | null = null;
  let endedAt: Date | null = params.currentEndedAt ?? null;

  if (status === "COMPLETED" || progressPercent >= 100) {
    status = "COMPLETED";
    progressPercent = 100;
    completionStatus = "COMPLETED";
    completedAt = params.currentCompletedAt ?? new Date();
    endedAt = params.currentEndedAt ?? new Date();
  }

  return {
    status,
    progressPercent,
    completionStatus,
    completedAt,
    endedAt,
  };
}

async function ensureStudent(studentId: string) {
  if (!isValidObjectId(studentId)) {
    throw new Error("ID học viên không hợp lệ");
  }

  const student = await UserModel.findById(studentId);

  if (!student) {
    throw new Error("Học viên không tồn tại");
  }

  if (student.role !== "STUDENT") {
    throw new Error("User này không phải học viên");
  }

  if (student.deletedAt) {
    throw new Error("Học viên đã bị xóa mềm");
  }

  return student;
}

async function ensureCourse(courseId: string) {
  if (!isValidObjectId(courseId)) {
    throw new Error("ID khóa học không hợp lệ");
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
    throw new Error("ID giảng viên không hợp lệ");
  }

  const teacher = await TeacherModel.findById(teacherId);

  if (!teacher) {
    throw new Error("Giảng viên không tồn tại");
  }

  return teacher;
}

async function ensureClassRoom(classRoomId: string) {
  if (!isValidObjectId(classRoomId)) {
    throw new Error("ID lớp học không hợp lệ");
  }

  const classRoom = await ClassRoomModel.findOne({
    _id: classRoomId,
    isDeleted: false,
  });

  if (!classRoom) {
    throw new Error("Lớp học không tồn tại");
  }

  return classRoom;
}

function buildSnapshotFromClassRoom(classRoom: {
  _id: Types.ObjectId;
  course: Types.ObjectId;
  teacher: Types.ObjectId;
  className: string;
  mode: "ONLINE" | "OFFLINE";
  scheduleText: string;
  room: string;
  startedAt?: Date | null;
  endedAt?: Date | null;
}) {
  return {
    classRoom: classRoom._id,
    course: classRoom.course,
    teacher: classRoom.teacher,
    className: classRoom.className || "",
    mode: classRoom.mode || "ONLINE",
    scheduleText: classRoom.scheduleText || "",
    room: classRoom.room || "",
    startedAt: classRoom.startedAt ?? null,
    endedAt: classRoom.endedAt ?? null,
  };
}

async function refreshClassRanking(classRoomId: string) {
  if (!classRoomId) return;

  const items = await studentStudyRepository.findByClassRoomForRanking(classRoomId);

  const sorted = [...items].sort((a: any, b: any) => {
    if ((b.score || 0) !== (a.score || 0)) {
      return (b.score || 0) - (a.score || 0);
    }

    return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
  });

  for (let i = 0; i < sorted.length; i += 1) {
    const item: any = sorted[i];
    const score = Number(item.score || 0);

    await studentStudyRepository.updateHonorFields(String(item._id), {
      rank: i + 1,
      performanceStatus: getPerformanceStatus(score),
    });
  }
}

type CreateStudentStudyPayload = {
  student: string;
  classRoom: string;
  status?: "ENROLLED" | "STUDYING" | "PAUSED" | "COMPLETED" | "DROPPED";
  note?: string;
  isActive?: boolean | "true" | "false";
};

type UpdateStudentStudyPayload = {
  classRoom?: string;
  status?: "ENROLLED" | "STUDYING" | "PAUSED" | "COMPLETED" | "DROPPED";
  note?: string;
  isActive?: boolean | "true" | "false";
};

type UpdateStudentStudyLearningPayload = {
  score?: string | number;
  progressPercent?: string | number;
  attendancePercent?: string | number;
  status?: "ENROLLED" | "STUDYING" | "PAUSED" | "COMPLETED" | "DROPPED";
};

type UpdateStudentStudyHonorPayload = {
  isHonored?: boolean;
  honorTitle?: string;
  showHonorOnUserPage?: boolean;
};

export const studentStudyService = {
  async getAll(query: {
    studentId?: string;
    courseId?: string;
    classRoomId?: string;
    teacherId?: string;
    mode?: string;
    status?: string;
    completionStatus?: string;
    isActive?: string;
  }) {
    return studentStudyRepository.findAll(query);
  },

  async getById(id: string) {
    const item = await studentStudyRepository.findById(id);

    if (!item) {
      throw new Error("Không tìm thấy dữ liệu học tập");
    }

    return item;
  },

  async getByStudent(studentId: string) {
    await ensureStudent(studentId);
    return studentStudyRepository.findByStudent(studentId);
  },

  async getByClassRoom(classRoomId: string) {
    await ensureClassRoom(classRoomId);
    return studentStudyRepository.findByClassRoom(classRoomId);
  },

  async getPublicHonors(limit?: string) {
    const safeLimit = Math.max(1, Math.min(Number(limit || 10), 20));
    return studentStudyRepository.findPublicHonors(safeLimit);
  },

  async create(payload: CreateStudentStudyPayload) {
    await ensureStudent(payload.student);

    const classRoom = await ensureClassRoom(payload.classRoom);
    const snapshot = buildSnapshotFromClassRoom(classRoom);

    await ensureCourse(String(snapshot.course));
    await ensureTeacher(String(snapshot.teacher));

    const duplicate = await studentStudyRepository.findDuplicateActive({
      student: payload.student,
      classRoom: payload.classRoom,
    });

    if (duplicate) {
      throw new Error("Học viên đã được gán vào lớp này");
    }

    const normalized = resolveCompletionFields({
      status: payload.status || "ENROLLED",
      progressPercent: 0,
      currentEndedAt: snapshot.endedAt ?? null,
    });

    const created = await studentStudyRepository.create({
      student: toObjectId(payload.student, "ID học viên không hợp lệ"),
      classRoom: toObjectId(payload.classRoom, "ID lớp học không hợp lệ"),
      course: snapshot.course,
      teacher: snapshot.teacher,

      className: snapshot.className,
      mode: snapshot.mode,
      scheduleText: snapshot.scheduleText,
      room: snapshot.room,

      status: normalized.status,
      completionStatus: normalized.completionStatus,
      completedAt: normalized.completedAt,

      score: 0,
      progressPercent: normalized.progressPercent,
      attendancePercent: 0,

      rank: null,
      performanceStatus: "NORMAL",
      isHonored: false,
      honorTitle: "",
      showHonorOnUserPage: false,

      startedAt: snapshot.startedAt ?? null,
      endedAt: normalized.endedAt ?? null,

      note: payload.note?.trim() || "",
      isActive: toBoolean(payload.isActive, true),
    });

    await refreshClassRanking(payload.classRoom);

    const item = await studentStudyRepository.findById(String(created._id));

    if (!item) {
      throw new Error("Tạo dữ liệu học tập thất bại");
    }

    return item;
  },

  async update(id: string, payload: UpdateStudentStudyPayload) {
    const current: any = await studentStudyRepository.findById(id);

    if (!current) {
      throw new Error("Không tìm thấy dữ liệu học tập");
    }

    const studentId = getRefId(current.student);
    const prevClassRoomId = getRefId(current.classRoom);

    const updateData: {
      classRoom?: Types.ObjectId;
      course?: Types.ObjectId;
      teacher?: Types.ObjectId | null;
      className?: string;
      mode?: "ONLINE" | "OFFLINE";
      scheduleText?: string;
      room?: string;
      startedAt?: Date | null;
      endedAt?: Date | null;
      status?: "ENROLLED" | "STUDYING" | "PAUSED" | "COMPLETED" | "DROPPED";
      completionStatus?: "NOT_COMPLETED" | "COMPLETED";
      completedAt?: Date | null;
      note?: string;
      isActive?: boolean;
    } = {};

    let nextClassRoomId = prevClassRoomId;
    let baseEndedAt = current.endedAt || null;

    if (payload.classRoom !== undefined) {
      const classRoom = await ensureClassRoom(payload.classRoom);
      const snapshot = buildSnapshotFromClassRoom(classRoom);

      updateData.classRoom = snapshot.classRoom;
      updateData.course = snapshot.course;
      updateData.teacher = snapshot.teacher;
      updateData.className = snapshot.className;
      updateData.mode = snapshot.mode;
      updateData.scheduleText = snapshot.scheduleText;
      updateData.room = snapshot.room;
      updateData.startedAt = snapshot.startedAt ?? null;
      updateData.endedAt = snapshot.endedAt ?? null;

      nextClassRoomId = payload.classRoom;
      baseEndedAt = snapshot.endedAt ?? null;
    }

    if (payload.note !== undefined) {
      updateData.note = payload.note.trim();
    }

    if (payload.isActive !== undefined) {
      updateData.isActive = toBoolean(payload.isActive, true);
    }

    if (payload.status !== undefined) {
      const normalized = resolveCompletionFields({
        status: payload.status,
        progressPercent: Number(current.progressPercent || 0),
        currentCompletedAt: current.completedAt || null,
        currentEndedAt: baseEndedAt,
      });

      updateData.status = normalized.status;
      updateData.completionStatus = normalized.completionStatus;
      updateData.completedAt = normalized.completedAt;
      updateData.endedAt = normalized.endedAt;
    }

    const duplicate = await studentStudyRepository.findDuplicateActiveExceptId({
      id,
      student: studentId,
      classRoom: nextClassRoomId,
    });

    if (duplicate) {
      throw new Error("Học viên đã được gán vào lớp này");
    }

    const updated = await studentStudyRepository.updateById(id, updateData);

    if (!updated) {
      throw new Error("Cập nhật thất bại");
    }

    await refreshClassRanking(prevClassRoomId);

    if (nextClassRoomId !== prevClassRoomId) {
      await refreshClassRanking(nextClassRoomId);
    }

    const fresh = await studentStudyRepository.findById(id);

    if (!fresh) {
      throw new Error("Cập nhật thất bại");
    }

    return fresh;
  },

  async updateLearning(id: string, payload: UpdateStudentStudyLearningPayload) {
    const current: any = await studentStudyRepository.findById(id);

    if (!current) {
      throw new Error("Không tìm thấy dữ liệu học tập");
    }

    const updateData: {
      score?: number;
      progressPercent?: number;
      attendancePercent?: number;
      performanceStatus?: "NORMAL" | "GOOD" | "EXCELLENT";
      status?: "ENROLLED" | "STUDYING" | "PAUSED" | "COMPLETED" | "DROPPED";
      completionStatus?: "NOT_COMPLETED" | "COMPLETED";
      completedAt?: Date | null;
      endedAt?: Date | null;
    } = {};

    let nextScore = Number(current.score || 0);
    let nextProgress = Number(current.progressPercent || 0);
    let nextStatus = current.status as
      | "ENROLLED"
      | "STUDYING"
      | "PAUSED"
      | "COMPLETED"
      | "DROPPED";

    if (payload.score !== undefined) {
      nextScore = Math.max(0, Math.min(100, toNumber(payload.score, 0)));
      updateData.score = nextScore;
      updateData.performanceStatus = getPerformanceStatus(nextScore);
    }

    if (payload.progressPercent !== undefined) {
      nextProgress = clampPercent(toNumber(payload.progressPercent, 0));
    }

    if (payload.attendancePercent !== undefined) {
      updateData.attendancePercent = clampPercent(
        toNumber(payload.attendancePercent, 0)
      );
    }

    if (payload.status !== undefined) {
      nextStatus = payload.status;
    }

    const normalized = resolveCompletionFields({
      status: nextStatus,
      progressPercent: nextProgress,
      currentCompletedAt: current.completedAt || null,
      currentEndedAt: current.endedAt || null,
    });

    updateData.status = normalized.status;
    updateData.progressPercent = normalized.progressPercent;
    updateData.completionStatus = normalized.completionStatus;
    updateData.completedAt = normalized.completedAt;
    updateData.endedAt = normalized.endedAt;

    const updated = await studentStudyRepository.updateById(id, updateData);

    if (!updated) {
      throw new Error("Cập nhật kết quả học tập thất bại");
    }

    const classRoomId = getRefId(current.classRoom);
    await refreshClassRanking(classRoomId);

    const fresh = await studentStudyRepository.findById(id);

    if (!fresh) {
      throw new Error("Cập nhật kết quả học tập thất bại");
    }

    return fresh;
  },

  async updateHonor(id: string, payload: UpdateStudentStudyHonorPayload) {
    const current: any = await studentStudyRepository.findById(id);

    if (!current) {
      throw new Error("Không tìm thấy dữ liệu học tập");
    }

    const updated = await studentStudyRepository.updateById(id, {
      isHonored:
        payload.isHonored !== undefined ? payload.isHonored : current.isHonored,
      honorTitle:
        payload.honorTitle !== undefined
          ? payload.honorTitle.trim()
          : current.honorTitle,
      showHonorOnUserPage:
        payload.showHonorOnUserPage !== undefined
          ? payload.showHonorOnUserPage
          : current.showHonorOnUserPage,
    });

    if (!updated) {
      throw new Error("Cập nhật vinh danh thất bại");
    }

    return updated;
  },

  async syncSnapshotByClassRoom(classRoomId: string) {
    const classRoom = await ensureClassRoom(classRoomId);
    const snapshot = buildSnapshotFromClassRoom(classRoom);

    await studentStudyRepository.syncSnapshotByClassRoom(classRoomId, {
      course: snapshot.course,
      teacher: snapshot.teacher,
      className: snapshot.className,
      mode: snapshot.mode,
      scheduleText: snapshot.scheduleText,
      room: snapshot.room,
      startedAt: snapshot.startedAt ?? null,
      endedAt: snapshot.endedAt ?? null,
    });

    await refreshClassRanking(classRoomId);
  },

  async remove(id: string) {
    const current: any = await studentStudyRepository.findById(id);

    if (!current) {
      throw new Error("Không tìm thấy dữ liệu học tập");
    }

    const classRoomId = getRefId(current.classRoom);

    const deleted = await studentStudyRepository.deleteById(id);

    if (!deleted) {
      throw new Error("Xóa thất bại");
    }

    await refreshClassRanking(classRoomId);

    return deleted;
  },
};