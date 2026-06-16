import { API_ENDPOINTS } from "../constants/api";
import type {
  AttendanceStatus,
  HomeworkStatus,
  StudentStudyItem,
  StudyClassRoom,
  StudyCourse,
  StudyMode,
  StudySessionItem,
  StudyStatus,
  StudyTeacher,
  StudyTeacherUser,
} from "../types/student-study.type";
import { httpClient } from "../utils/httpClient";

type AnyObj = Record<string, unknown>;

function isObject(value: unknown): value is AnyObj {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;

  if (isObject(raw)) {
    const keys = ["items", "data", "students", "studies", "sessions"] as const;

    for (const key of keys) {
      const value = raw[key];
      if (Array.isArray(value)) return value;
    }
  }

  return [];
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function asBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function parseMode(value: unknown): StudyMode {
  return value === "OFFLINE" ? "OFFLINE" : "ONLINE";
}

function parseStatus(value: unknown): StudyStatus {
  const raw = asString(value, "ENROLLED");
  if (
    raw === "ENROLLED" ||
    raw === "STUDYING" ||
    raw === "PAUSED" ||
    raw === "COMPLETED" ||
    raw === "DROPPED"
  ) {
    return raw;
  }

  return "ENROLLED";
}

function parseAttendanceStatus(value: unknown): AttendanceStatus {
  const raw = asString(value, "ABSENT");
  if (raw === "PRESENT" || raw === "LATE" || raw === "ABSENT") return raw;
  return "ABSENT";
}

function parseHomeworkStatus(value: unknown): HomeworkStatus {
  return value === "DONE" ? "DONE" : "MISSING";
}

function normalizeTeacherUser(raw: unknown): StudyTeacherUser | null {
  if (!isObject(raw)) return null;

  return {
    _id: asString(raw._id),
    id: asString(raw.id),
    name: asString(raw.name),
    email: asString(raw.email),
  };
}

function normalizeTeacher(raw: unknown): StudyTeacher | null {
  if (!isObject(raw)) return null;

  return {
    _id: asString(raw._id),
    id: asString(raw.id),
    specialty: asString(raw.specialty),
    avatar: asString(raw.avatar),
    user: normalizeTeacherUser(raw.user),
  };
}

function normalizeCourse(raw: unknown): StudyCourse | null {
  if (!isObject(raw)) return null;

  return {
    _id: asString(raw._id),
    id: asString(raw.id),
    title: asString(raw.title),
    slug: asString(raw.slug),
    level: asString(raw.level),
    image: asString(raw.image),
  };
}

function normalizeClassRoom(raw: unknown): StudyClassRoom | null {
  if (!isObject(raw)) return null;

  return {
    _id: asString(raw._id),
    id: asString(raw.id),
    className: asString(raw.className),
    mode: parseMode(raw.mode),
    scheduleText: asString(raw.scheduleText),
    room: asString(raw.room),
    startedAt: typeof raw.startedAt === "string" ? raw.startedAt : null,
    endedAt: typeof raw.endedAt === "string" ? raw.endedAt : null,
    course:
      typeof raw.course === "string" ? raw.course : normalizeCourse(raw.course),
    teacher:
      typeof raw.teacher === "string"
        ? raw.teacher
        : normalizeTeacher(raw.teacher),
  };
}

function normalizeSession(raw: unknown): StudySessionItem {
  const obj = isObject(raw) ? raw : {};

  return {
    sessionNo: asNumber(obj.sessionNo, 0),
    date: typeof obj.date === "string" ? obj.date : null,
    attendanceStatus: parseAttendanceStatus(obj.attendanceStatus),
    homeworkStatus: parseHomeworkStatus(obj.homeworkStatus),
    teacherNote: asString(obj.teacherNote),
    progressScore: asNumber(obj.progressScore, 0),
  };
}

function normalizeStudy(raw: unknown): StudentStudyItem {
  const obj = isObject(raw) ? raw : {};

  return {
    _id: asString(obj._id) || asString(obj.id),
    course:
      typeof obj.course === "string" ? obj.course : normalizeCourse(obj.course),
    classRoom:
      typeof obj.classRoom === "string"
        ? obj.classRoom
        : normalizeClassRoom(obj.classRoom),
    teacher:
      typeof obj.teacher === "string"
        ? obj.teacher
        : normalizeTeacher(obj.teacher),
    className: asString(obj.className),
    mode: parseMode(obj.mode),
    scheduleText: asString(obj.scheduleText),
    room: asString(obj.room),
    status: parseStatus(obj.status),
    score: asNumber(obj.score, 0),
    progressPercent: asNumber(obj.progressPercent, 0),
    attendancePercent: asNumber(obj.attendancePercent, 0),
    test1: asNumber(obj.test1, 0),
    test2: asNumber(obj.test2, 0),
    test3: asNumber(obj.test3, 0),
    finalAverage: asNumber(obj.finalAverage, 0),
    sessions: pickArray(obj.sessions).map(normalizeSession),
    startedAt: typeof obj.startedAt === "string" ? obj.startedAt : null,
    endedAt: typeof obj.endedAt === "string" ? obj.endedAt : null,
    note: asString(obj.note),
    isActive: asBoolean(obj.isActive, true),
    createdAt: asString(obj.createdAt),
    updatedAt: asString(obj.updatedAt),
  };
}

export const studentStudyService = {
  async listByStudent(studentId: string) {
    const response = await httpClient.get<unknown>(
      API_ENDPOINTS.students.studies(studentId)
    );

    return pickArray(response).map(normalizeStudy);
  },
};
