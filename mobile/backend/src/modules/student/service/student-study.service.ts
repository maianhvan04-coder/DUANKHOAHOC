import { isValidObjectId, Types } from "mongoose";
import { studentStudyRepository } from "../repository/student-study.repository";
import { UserModel } from "../../user/user.model";
import { StudentModel } from "../student.model";
import { ProductModel } from "../../course/course.model";
import { TeacherModel } from "../../teacher/teacher.model";
import { ClassRoomModel } from "../../classroom/classroom.model";

type StudyStatus =
  | "ENROLLED"
  | "STUDYING"
  | "PAUSED"
  | "COMPLETED"
  | "DROPPED";

type CompletionStatus = "NOT_COMPLETED" | "COMPLETED";
type PerformanceStatus = "NORMAL" | "GOOD" | "EXCELLENT";
type AcademicLevel =
  | "EXCELLENT"
  | "GOOD"
  | "AVERAGE"
  | "WEAK"
  | "POOR";

type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT";
type HomeworkStatus = "DONE" | "MISSING";
type ClassMode = "ONLINE" | "OFFLINE";

type StudySessionInput = {
  sessionNo: number;
  date: Date | null;
  attendanceStatus: AttendanceStatus;
  homeworkStatus: HomeworkStatus;
  teacherNote: string;
  progressScore: number;
};

type RawStudySession = {
  sessionNo?: unknown;
  date?: unknown;
  attendanceStatus?: unknown;
  homeworkStatus?: unknown;
  teacherNote?: unknown;
  progressScore?: unknown;
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
};

type CreateStudentStudyPayload = {
  student: string;
  classRoom: string;
  status?: StudyStatus;
  note?: string;
  isActive?: boolean | "true" | "false";
};

type UpdateStudentStudyPayload = {
  classRoom?: string;
  status?: StudyStatus;
  note?: string;
  isActive?: boolean | "true" | "false";
};

type UpdateStudentStudyLearningPayload = {
  score?: string | number;
  progressPercent?: string | number;
  attendancePercent?: string | number;
  status?: StudyStatus;
};

type UpdateStudentStudySessionPayload = {
  sessionNo: number;
  date?: string | null;
  attendanceStatus?: AttendanceStatus;
  homeworkStatus?: HomeworkStatus;
  teacherNote?: string;
  progressScore?: string | number;
};

type UpdateStudentStudyTestsPayload = {
  test1?: string | number;
  test2?: string | number;
  test3?: string | number;
};

type UpdateStudentStudyHonorPayload = {
  isHonored?: boolean;
  honorTitle?: string;
  showHonorOnUserPage?: boolean;
};

type SnapshotFromClassRoom = {
  classRoom: Types.ObjectId;
  course: Types.ObjectId;
  teacher: Types.ObjectId;
  className: string;
  mode: ClassMode;
  scheduleText: string;
  room: string;
  startedAt: Date | null;
  endedAt: Date | null;
};

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
  if (value === undefined || value === null || value === "") return fallback;

  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function clampPercent(value: number) {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

function clampTestScore(value: number) {
  if (value < 0) return 0;
  if (value > 10) return 10;
  return Number(value.toFixed(1));
}

function clampScore100(value: number) {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Number(value.toFixed(1));
}

function getPerformanceStatus(score: number): PerformanceStatus {
  if (score >= 85) return "EXCELLENT";
  if (score >= 70) return "GOOD";
  return "NORMAL";
}

function getAcademicLevel(finalAverage: number): AcademicLevel {
  if (finalAverage >= 8.5) return "EXCELLENT";
  if (finalAverage >= 7) return "GOOD";
  if (finalAverage >= 5.5) return "AVERAGE";
  if (finalAverage >= 4) return "WEAK";
  return "POOR";
}

function getRefId(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value instanceof Types.ObjectId) return value.toString();

  if (typeof value === "object" && "_id" in (value as Record<string, unknown>)) {
    return String((value as { _id?: unknown })._id || "");
  }

  return "";
}

function parseDateOrNull(value: unknown, errorMessage: string) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    throw new Error(errorMessage);
  }

  return date;
}

function normalizeDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function calcSessionProgress(
  attendanceStatus: AttendanceStatus,
  homeworkStatus: HomeworkStatus
) {
  if (attendanceStatus === "PRESENT" && homeworkStatus === "DONE") return 100;
  if (attendanceStatus === "PRESENT" && homeworkStatus === "MISSING") return 70;
  if (attendanceStatus === "LATE" && homeworkStatus === "DONE") return 80;
  if (attendanceStatus === "LATE" && homeworkStatus === "MISSING") return 50;
  if (attendanceStatus === "ABSENT" && homeworkStatus === "DONE") return 30;
  return 0;
}

function createDefaultSessions(): StudySessionInput[] {
  return Array.from({ length: 30 }, (_, index) => ({
    sessionNo: index + 1,
    date: null,
    attendanceStatus: "ABSENT",
    homeworkStatus: "MISSING",
    teacherNote: "",
    progressScore: 0,
  }));
}

function normalizeAttendanceStatus(value: unknown): AttendanceStatus {
  if (value === "PRESENT" || value === "LATE" || value === "ABSENT") {
    return value;
  }
  return "ABSENT";
}

function normalizeHomeworkStatus(value: unknown): HomeworkStatus {
  if (value === "DONE" || value === "MISSING") {
    return value;
  }
  return "MISSING";
}

function normalizeSessions(input: unknown): StudySessionInput[] {
  const base = createDefaultSessions();

  if (!Array.isArray(input)) {
    return base;
  }

  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;

    const item = raw as RawStudySession;
    const sessionNo = Number(item.sessionNo);

    if (!Number.isInteger(sessionNo) || sessionNo < 1 || sessionNo > 30) {
      continue;
    }

    const attendanceStatus = normalizeAttendanceStatus(item.attendanceStatus);
    const homeworkStatus = normalizeHomeworkStatus(item.homeworkStatus);
    const defaultProgress = calcSessionProgress(attendanceStatus, homeworkStatus);

    base[sessionNo - 1] = {
      sessionNo,
      date: normalizeDate(item.date),
      attendanceStatus,
      homeworkStatus,
      teacherNote: String(item.teacherNote || "").trim(),
      progressScore: clampPercent(
        item.progressScore !== undefined
          ? toNumber(item.progressScore, defaultProgress)
          : defaultProgress
      ),
    };
  }

  return base;
}

function calcAttendancePercent(sessions: StudySessionInput[]) {
  if (!sessions.length) return 0;

  const total = sessions.reduce((sum, item) => {
    if (item.attendanceStatus === "PRESENT") return sum + 1;
    if (item.attendanceStatus === "LATE") return sum + 0.5;
    return sum;
  }, 0);

  return Math.round((total / sessions.length) * 100);
}

function calcProgressPercent(sessions: StudySessionInput[]) {
  if (!sessions.length) return 0;

  const total = sessions.reduce((sum, item) => sum + item.progressScore, 0);
  return Math.round(total / sessions.length);
}

function calcFinalAverage(params: {
  attendancePercent: number;
  progressPercent: number;
  test1: number;
  test2: number;
  test3: number;
}) {
  const attendance10 = (params.attendancePercent / 100) * 10;
  const progress10 = (params.progressPercent / 100) * 10;
  const testsAvg = (params.test1 + params.test2 + params.test3) / 3;

  const finalAverage =
    attendance10 * 0.3 + progress10 * 0.2 + testsAvg * 0.5;

  return Number(finalAverage.toFixed(1));
}

function resolveCompletionFields(params: {
  status: StudyStatus;
  progressPercent: number;
  currentCompletedAt?: Date | null;
  currentEndedAt?: Date | null;
}) {
  let status = params.status;
  let progressPercent = clampPercent(params.progressPercent);

  let completionStatus: CompletionStatus = "NOT_COMPLETED";
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

function recomputeStudyDerived(doc: {
  sessions?: unknown;
  test1?: unknown;
  test2?: unknown;
  test3?: unknown;
  status?: StudyStatus;
  completedAt?: Date | null;
  endedAt?: Date | null;
}) {
  const sessions = normalizeSessions(doc.sessions);

  const attendancePercent = calcAttendancePercent(sessions);
  const progressPercent = calcProgressPercent(sessions);

  const test1 = clampTestScore(toNumber(doc.test1, 0));
  const test2 = clampTestScore(toNumber(doc.test2, 0));
  const test3 = clampTestScore(toNumber(doc.test3, 0));

  const finalAverage = calcFinalAverage({
    attendancePercent,
    progressPercent,
    test1,
    test2,
    test3,
  });

  const score = clampScore100(finalAverage * 10);
  const performanceStatus = getPerformanceStatus(score);
  const academicLevel = getAcademicLevel(finalAverage);

  const normalized = resolveCompletionFields({
    status: doc.status || "ENROLLED",
    progressPercent,
    currentCompletedAt: doc.completedAt || null,
    currentEndedAt: doc.endedAt || null,
  });

  return {
    sessions,
    attendancePercent,
    progressPercent: normalized.progressPercent,
    test1,
    test2,
    test3,
    finalAverage,
    score,
    performanceStatus,
    academicLevel,
    status: normalized.status,
    completionStatus: normalized.completionStatus,
    completedAt: normalized.completedAt,
    endedAt: normalized.endedAt,
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

  if (student.deletedAt) {
    throw new Error("Học viên đã bị xóa mềm");
  }

  const profile = await StudentModel.findOne({
    user: studentId,
    isDeleted: false,
  }).lean();

  if (!profile) {
    throw new Error("Hồ sơ học viên không tồn tại");
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
  mode: ClassMode;
  scheduleText: string;
  room: string;
  startedAt?: Date | null;
  endedAt?: Date | null;
}): SnapshotFromClassRoom {
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

  const sorted = [...items].sort((a, b) => {
    const scoreA = Number(a.score || 0);
    const scoreB = Number(b.score || 0);

    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    return (
      new Date(a.updatedAt || 0).getTime() -
      new Date(b.updatedAt || 0).getTime()
    );
  });

  for (let i = 0; i < sorted.length; i += 1) {
    const item = sorted[i];
    const score = Number(item.score || 0);

    await studentStudyRepository.updateRankFields(String(item._id), {
      rank: i + 1,
      performanceStatus: getPerformanceStatus(score),
    });
  }
}

export const studentStudyService = {
  async getAll(query: StudentStudyQuery) {
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

    const derived = recomputeStudyDerived({
      sessions: createDefaultSessions(),
      test1: 0,
      test2: 0,
      test3: 0,
      status: payload.status || "ENROLLED",
      endedAt: snapshot.endedAt ?? null,
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

      status: derived.status,
      completionStatus: derived.completionStatus,
      completedAt: derived.completedAt,

      score: derived.score,
      progressPercent: derived.progressPercent,
      attendancePercent: derived.attendancePercent,

      test1: derived.test1,
      test2: derived.test2,
      test3: derived.test3,
      finalAverage: derived.finalAverage,
      academicLevel: derived.academicLevel,

      sessions: derived.sessions,

      rank: null,
      performanceStatus: derived.performanceStatus,
      isHonored: false,
      honorTitle: "",
      showHonorOnUserPage: false,

      startedAt: snapshot.startedAt ?? null,
      endedAt: derived.endedAt ?? null,

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
    const current = await studentStudyRepository.findById(id);

    if (!current) {
      throw new Error("Không tìm thấy dữ liệu học tập");
    }

    const studentId = getRefId(current.student);
    const prevClassRoomId = getRefId(current.classRoom);

    const updateData: {
      classRoom?: Types.ObjectId;
      course?: Types.ObjectId;
      teacher?: Types.ObjectId;
      className?: string;
      mode?: ClassMode;
      scheduleText?: string;
      room?: string;
      startedAt?: Date | null;
      endedAt?: Date | null;
      status?: StudyStatus;
      completionStatus?: CompletionStatus;
      completedAt?: Date | null;
      note?: string;
      isActive?: boolean;
    } = {};

    let nextClassRoomId = prevClassRoomId;
    let baseEndedAt = current.endedAt || null;
    const nextStatus = payload.status ?? current.status;

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

    const normalized = resolveCompletionFields({
      status: nextStatus,
      progressPercent: Number(current.progressPercent || 0),
      currentCompletedAt: current.completedAt || null,
      currentEndedAt: baseEndedAt,
    });

    updateData.status = normalized.status;
    updateData.completionStatus = normalized.completionStatus;
    updateData.completedAt = normalized.completedAt;
    updateData.endedAt = normalized.endedAt;

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
    const current = await studentStudyRepository.findDocById(id);

    if (!current) {
      throw new Error("Không tìm thấy dữ liệu học tập");
    }

    let nextScore = Number(current.score || 0);
    let nextProgress = Number(current.progressPercent || 0);
    let nextAttendance = Number(current.attendancePercent || 0);
    let nextStatus = current.status as StudyStatus;

    if (payload.score !== undefined) {
      nextScore = clampScore100(toNumber(payload.score, 0));
    }

    if (payload.progressPercent !== undefined) {
      nextProgress = clampPercent(toNumber(payload.progressPercent, 0));
    }

    if (payload.attendancePercent !== undefined) {
      nextAttendance = clampPercent(toNumber(payload.attendancePercent, 0));
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

    const finalAverage = Number((nextScore / 10).toFixed(1));

    const updated = await studentStudyRepository.updateById(id, {
      score: nextScore,
      progressPercent: normalized.progressPercent,
      attendancePercent: nextAttendance,
      performanceStatus: getPerformanceStatus(nextScore),
      finalAverage,
      academicLevel: getAcademicLevel(finalAverage),
      status: normalized.status,
      completionStatus: normalized.completionStatus,
      completedAt: normalized.completedAt,
      endedAt: normalized.endedAt,
    });

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

  async updateSession(
    id: string,
    sessionNoOrPayload: number | UpdateStudentStudySessionPayload,
    payloadMaybe?: Omit<UpdateStudentStudySessionPayload, "sessionNo">
  ) {
    const study = await studentStudyRepository.findDocById(id);

    if (!study) {
      throw new Error("Không tìm thấy dữ liệu học tập");
    }

    const payload: UpdateStudentStudySessionPayload =
      typeof sessionNoOrPayload === "number"
        ? {
            sessionNo: sessionNoOrPayload,
            ...(payloadMaybe ?? {}),
          }
        : sessionNoOrPayload;

    const sessionNo = Number(payload.sessionNo);

    if (!Number.isInteger(sessionNo) || sessionNo < 1 || sessionNo > 30) {
      throw new Error("Buổi học không hợp lệ");
    }

    const sessions = normalizeSessions(study.sessions);
    const index = sessionNo - 1;
    const prev = sessions[index];

    const nextAttendance = normalizeAttendanceStatus(
      payload.attendanceStatus ?? prev.attendanceStatus
    );

    const nextHomework = normalizeHomeworkStatus(
      payload.homeworkStatus ?? prev.homeworkStatus
    );

    const nextDate =
      payload.date !== undefined
        ? parseDateOrNull(payload.date, "Ngày học không hợp lệ")
        : prev.date;

    const nextProgressScore =
      payload.progressScore !== undefined
        ? clampPercent(toNumber(payload.progressScore, 0))
        : prev.progressScore > 0
          ? clampPercent(prev.progressScore)
          : calcSessionProgress(nextAttendance, nextHomework);

    sessions[index] = {
      sessionNo,
      date: nextDate === undefined ? prev.date : nextDate,
      attendanceStatus: nextAttendance,
      homeworkStatus: nextHomework,
      teacherNote:
        payload.teacherNote !== undefined
          ? String(payload.teacherNote || "").trim()
          : prev.teacherNote,
      progressScore: nextProgressScore,
    };

    const derived = recomputeStudyDerived({
      sessions,
      test1: study.test1,
      test2: study.test2,
      test3: study.test3,
      status: study.status as StudyStatus,
      completedAt: study.completedAt || null,
      endedAt: study.endedAt || null,
    });

    study.sessions = derived.sessions;
    study.attendancePercent = derived.attendancePercent;
    study.progressPercent = derived.progressPercent;
    study.test1 = derived.test1;
    study.test2 = derived.test2;
    study.test3 = derived.test3;
    study.finalAverage = derived.finalAverage;
    study.score = derived.score;
    study.performanceStatus = derived.performanceStatus;
    study.academicLevel = derived.academicLevel;
    study.status = derived.status;
    study.completionStatus = derived.completionStatus;
    study.completedAt = derived.completedAt;
    study.endedAt = derived.endedAt;

    await study.save();

    const classRoomId = getRefId(study.classRoom);
    await refreshClassRanking(classRoomId);

    const fresh = await studentStudyRepository.findById(id);

    if (!fresh) {
      throw new Error("Cập nhật buổi học thất bại");
    }

    return fresh;
  },

  async updateTests(id: string, payload: UpdateStudentStudyTestsPayload) {
    const study = await studentStudyRepository.findDocById(id);

    if (!study) {
      throw new Error("Không tìm thấy dữ liệu học tập");
    }

    if (payload.test1 !== undefined) {
      study.test1 = clampTestScore(toNumber(payload.test1, 0));
    }

    if (payload.test2 !== undefined) {
      study.test2 = clampTestScore(toNumber(payload.test2, 0));
    }

    if (payload.test3 !== undefined) {
      study.test3 = clampTestScore(toNumber(payload.test3, 0));
    }

    const derived = recomputeStudyDerived({
      sessions: study.sessions,
      test1: study.test1,
      test2: study.test2,
      test3: study.test3,
      status: study.status as StudyStatus,
      completedAt: study.completedAt || null,
      endedAt: study.endedAt || null,
    });

    study.sessions = derived.sessions;
    study.attendancePercent = derived.attendancePercent;
    study.progressPercent = derived.progressPercent;
    study.test1 = derived.test1;
    study.test2 = derived.test2;
    study.test3 = derived.test3;
    study.finalAverage = derived.finalAverage;
    study.score = derived.score;
    study.performanceStatus = derived.performanceStatus;
    study.academicLevel = derived.academicLevel;
    study.status = derived.status;
    study.completionStatus = derived.completionStatus;
    study.completedAt = derived.completedAt;
    study.endedAt = derived.endedAt;

    await study.save();

    const classRoomId = getRefId(study.classRoom);
    await refreshClassRanking(classRoomId);

    const fresh = await studentStudyRepository.findById(id);

    if (!fresh) {
      throw new Error("Cập nhật điểm kiểm tra thất bại");
    }

    return fresh;
  },

  async updateHonor(id: string, payload: UpdateStudentStudyHonorPayload) {
    const current = await studentStudyRepository.findById(id);

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
    const current = await studentStudyRepository.findById(id);

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
