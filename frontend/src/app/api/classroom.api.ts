import { http } from "@/lib/utils/http";
import {
  readPaginationMeta,
  type ListResult,
  type SortDirection,
} from "@/lib/utils/admin-list";

export type ClassMode = "ONLINE" | "OFFLINE";

export type StudyStatus =
  | "ENROLLED"
  | "STUDYING"
  | "PAUSED"
  | "COMPLETED"
  | "DROPPED";

export type CompletionStatus = "NOT_COMPLETED" | "COMPLETED";

export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT";

export type HomeworkStatus = "DONE" | "MISSING";

export type AcademicLevel =
  | "EXCELLENT"
  | "GOOD"
  | "AVERAGE"
  | "WEAK"
  | "POOR";

export type PerformanceStatus = "NORMAL" | "GOOD" | "EXCELLENT";

type AnyObj = Record<string, unknown>;

export type ClassroomTeacherUser = {
  _id: string;
  id?: string;
  name?: string;
  email?: string;
};

export type ClassroomTeacher = {
  _id: string;
  id?: string;
  name?: string;
  email?: string;
  specialty?: string;
  avatar?: string;
  user?: ClassroomTeacherUser | null;
};

export type ClassroomCategory = {
  _id: string;
  id?: string;
  name?: string;
  slug?: string;
};

export type ClassroomCourse = {
  _id: string;
  id?: string;
  title?: string;
  slug?: string;
  shortDescription?: string;
  image?: string;
  level?: string;
  status?: string;
  category?: string | ClassroomCategory | null;
};

export type ClassroomStudent = {
  _id: string;
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  active?: boolean;
  deletedAt?: string | null;
};

export type ClassroomSessionItem = {
  _id?: string;
  sessionNo: number;
  date?: string | null;
  attendanceStatus?: AttendanceStatus;
  homeworkStatus?: HomeworkStatus;
  progressScore?: number;
  teacherNote?: string;
};

export type ClassroomItem = {
  _id: string;
  id?: string;
  course?: ClassroomCourse | string | null;
  teacher?: ClassroomTeacher | string | null;
  className: string;
  mode: ClassMode;
  scheduleText: string;
  room: string;
  startedAt?: string | null;
  endedAt?: string | null;
  maxStudents: number;
  isActive: boolean;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ClassroomStudentStudyItem = {
  _id: string;
  id?: string;
  student?: ClassroomStudent | string | null;
  course?: ClassroomCourse | string | null;
  teacher?: ClassroomTeacher | string | null;
  classRoom?: ClassroomItem | string | null;

  className: string;
  mode: ClassMode;
  scheduleText: string;
  room: string;

  status: StudyStatus;
  completionStatus: CompletionStatus;

  attendancePercent: number;
  progressPercent: number;

  test1: number;
  test2: number;
  test3: number;

  score: number;
  finalAverage: number;
  academicLevel: AcademicLevel;

  rank: number | null;
  performanceStatus: PerformanceStatus;

  isHonored: boolean;
  honorTitle: string;
  showHonorOnUserPage: boolean;

  note: string;
  isActive: boolean;

  sessions: ClassroomSessionItem[];

  startedAt?: string | null;
  endedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CourseOption = {
  _id: string;
  id?: string;
  title: string;
};

export type TeacherOptionUser = {
  _id: string;
  id?: string;
  name?: string;
  email?: string;
};

export type TeacherOption = {
  _id: string;
  id?: string;
  name?: string;
  email?: string;
  specialty?: string;
  avatar?: string;
  user?: TeacherOptionUser | null;
};

export type CreateClassroomPayload = {
  course: string;
  teacher: string;
  className: string;
  mode?: ClassMode;
  scheduleText?: string;
  room?: string;
  startedAt?: string;
  endedAt?: string;
  maxStudents?: string | number;
  isActive?: boolean | "true" | "false";
};

export type UpdateClassroomPayload = Partial<
  Omit<CreateClassroomPayload, "startedAt" | "endedAt">
> & {
  startedAt?: string | null;
  endedAt?: string | null;
};

export type UpdateStudentLearningPayload = {
  status?: StudyStatus;
  completionStatus?: CompletionStatus;
  attendancePercent?: number | string;
  progressPercent?: number | string;
  score?: number | string;
  note?: string;
};

export type UpdateStudentStudyPayload = {
  status?: StudyStatus;
  note?: string;
  isActive?: boolean | "true" | "false";
};

export type UpdateStudentTestsPayload = {
  test1?: number;
  test2?: number;
  test3?: number;
};

export type UpdateStudentHonorPayload = {
  isHonored?: boolean;
  honorTitle?: string;
  showHonorOnUserPage?: boolean;
};

export type UpdateStudentSessionPayload = {
  sessionNo: number;
  date?: string | null;
  attendanceStatus?: AttendanceStatus;
  homeworkStatus?: HomeworkStatus;
  progressScore?: number;
  teacherNote?: string;
};

function isObject(value: unknown): value is AnyObj {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!isObject(raw)) return [];

  const keys = [
    "items",
    "data",
    "classes",
    "classrooms",
    "classRooms",
    "students",
    "teachers",
    "products",
    "courses",
    "lessonRecords",
    "sessions",
  ] as const;

  for (const key of keys) {
    const value = raw[key];
    if (Array.isArray(value)) return value;
  }

  return [];
}

function pickItem(raw: unknown): AnyObj | null {
  if (!isObject(raw)) return null;

  const keys = ["item", "data", "classRoom", "student", "study"] as const;

  for (const key of keys) {
    const value = raw[key];
    if (isObject(value)) return value;
  }

  return raw;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function parseClassMode(value: unknown): ClassMode {
  const raw = asString(value, "ONLINE");
  return raw === "ONLINE" || raw === "OFFLINE" ? raw : "ONLINE";
}

function parseStudyStatus(value: unknown): StudyStatus {
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

function parseCompletionStatus(value: unknown): CompletionStatus {
  const raw = asString(value, "NOT_COMPLETED");
  return raw === "COMPLETED" ? "COMPLETED" : "NOT_COMPLETED";
}

function parseAttendanceStatus(value: unknown): AttendanceStatus {
  const raw = asString(value, "ABSENT");
  if (raw === "PRESENT" || raw === "LATE" || raw === "ABSENT") return raw;
  return "ABSENT";
}

function parseHomeworkStatus(value: unknown): HomeworkStatus {
  const raw = asString(value, "MISSING");
  return raw === "DONE" ? "DONE" : "MISSING";
}

function parseAcademicLevel(value: unknown): AcademicLevel {
  const raw = asString(value, "AVERAGE");
  if (
    raw === "EXCELLENT" ||
    raw === "GOOD" ||
    raw === "AVERAGE" ||
    raw === "WEAK" ||
    raw === "POOR"
  ) {
    return raw;
  }
  return "AVERAGE";
}

function parsePerformanceStatus(value: unknown): PerformanceStatus {
  const raw = asString(value, "NORMAL");
  if (raw === "NORMAL" || raw === "GOOD" || raw === "EXCELLENT") return raw;
  return "NORMAL";
}

function getId(value: unknown): string {
  if (!isObject(value)) return "";
  return asString(value._id) || asString(value.id);
}

function normalizeTeacherUser(raw: unknown): ClassroomTeacherUser | null {
  if (!isObject(raw)) return null;

  const _id = getId(raw);
  if (!_id) return null;

  return {
    _id,
    id: asString(raw.id),
    name: asString(raw.name),
    email: asString(raw.email),
  };
}

function normalizeTeacher(raw: unknown): ClassroomTeacher | null {
  if (!isObject(raw)) return null;

  const _id = getId(raw);
  if (!_id) return null;

  return {
    _id,
    id: asString(raw.id),
    name: asString(raw.name),
    email: asString(raw.email),
    specialty: asString(raw.specialty),
    avatar: asString(raw.avatar),
    user: normalizeTeacherUser(raw.user),
  };
}

function normalizeCategory(raw: unknown): ClassroomCategory | null {
  if (!isObject(raw)) return null;

  const _id = getId(raw);
  if (!_id) return null;

  return {
    _id,
    id: asString(raw.id),
    name: asString(raw.name),
    slug: asString(raw.slug),
  };
}

function normalizeCourse(raw: unknown): ClassroomCourse | null {
  if (!isObject(raw)) return null;

  const _id = getId(raw);
  if (!_id) return null;

  return {
    _id,
    id: asString(raw.id),
    title: asString(raw.title),
    slug: asString(raw.slug),
    shortDescription: asString(raw.shortDescription),
    image: asString(raw.image),
    level: asString(raw.level),
    status: asString(raw.status),
    category:
      typeof raw.category === "string"
        ? raw.category
        : normalizeCategory(raw.category),
  };
}

function normalizeStudent(raw: unknown): ClassroomStudent | null {
  if (!isObject(raw)) return null;

  const _id = getId(raw);
  if (!_id) return null;

  return {
    _id,
    id: asString(raw.id),
    name: asString(raw.name),
    email: asString(raw.email),
    role: asString(raw.role),
    active: asBoolean(raw.active, true),
    deletedAt: asNullableString(raw.deletedAt),
  };
}

function normalizeSession(raw: unknown, index = 0): ClassroomSessionItem {
  const obj = isObject(raw) ? raw : {};

  return {
    _id: asString(obj._id),
    sessionNo: asNumber(obj.sessionNo, index + 1),
    date:
      typeof obj.date === "string"
        ? obj.date
        : typeof obj.lessonDate === "string"
          ? obj.lessonDate
          : null,
    attendanceStatus: parseAttendanceStatus(obj.attendanceStatus),
    homeworkStatus: parseHomeworkStatus(obj.homeworkStatus),
    progressScore: asNumber(obj.progressScore ?? obj.progressPercent, 0),
    teacherNote: asString(obj.teacherNote),
  };
}

function normalizeClassroom(raw: unknown): ClassroomItem {
  const obj = isObject(raw) ? raw : {};
  const _id = getId(obj);

  return {
    _id,
    id: asString(obj.id),
    course:
      typeof obj.course === "string"
        ? obj.course
        : normalizeCourse(obj.course),
    teacher:
      typeof obj.teacher === "string"
        ? obj.teacher
        : normalizeTeacher(obj.teacher),
    className: asString(obj.className),
    mode: parseClassMode(obj.mode),
    scheduleText: asString(obj.scheduleText),
    room: asString(obj.room),
    startedAt: asNullableString(obj.startedAt),
    endedAt: asNullableString(obj.endedAt),
    maxStudents: asNumber(obj.maxStudents, 0),
    isActive: asBoolean(obj.isActive, true),
    isDeleted: asBoolean(obj.isDeleted, false),
    deletedAt: asNullableString(obj.deletedAt),
    createdAt: asString(obj.createdAt),
    updatedAt: asString(obj.updatedAt),
  };
}

function normalizeStudentStudy(raw: unknown): ClassroomStudentStudyItem {
  const obj = isObject(raw) ? raw : {};
  const _id = getId(obj);

  const rawSessions = Array.isArray(obj.sessions)
    ? obj.sessions
    : Array.isArray(obj.lessonRecords)
      ? obj.lessonRecords
      : [];

  const test1 = asNumber(obj.test1, 0);
  const test2 = asNumber(obj.test2, 0);
  const test3 = asNumber(obj.test3, 0);

  const score = asNumber(obj.score ?? obj.totalScore ?? obj.finalScore, 0);

  const finalAverage =
    obj.finalAverage !== undefined
      ? asNumber(obj.finalAverage, 0)
      : Number(((test1 + test2 + test3) / 3).toFixed(1));

  return {
    _id,
    id: asString(obj.id),
    student:
      typeof obj.student === "string"
        ? obj.student
        : normalizeStudent(obj.student),
    course:
      typeof obj.course === "string"
        ? obj.course
        : normalizeCourse(obj.course),
    teacher:
      typeof obj.teacher === "string"
        ? obj.teacher
        : normalizeTeacher(obj.teacher),
    classRoom:
      typeof obj.classRoom === "string"
        ? obj.classRoom
        : normalizeClassroom(obj.classRoom),

    className: asString(obj.className),
    mode: parseClassMode(obj.mode),
    scheduleText: asString(obj.scheduleText),
    room: asString(obj.room),

    status: parseStudyStatus(obj.status),
    completionStatus: parseCompletionStatus(obj.completionStatus),

    attendancePercent: asNumber(obj.attendancePercent, 0),
    progressPercent: asNumber(obj.progressPercent, 0),

    test1,
    test2,
    test3,

    score,
    finalAverage,
    academicLevel: parseAcademicLevel(obj.academicLevel),

    rank: asNullableNumber(obj.rank),
    performanceStatus: parsePerformanceStatus(obj.performanceStatus),

    isHonored: asBoolean(obj.isHonored, false),
    honorTitle: asString(obj.honorTitle),
    showHonorOnUserPage: asBoolean(obj.showHonorOnUserPage, false),

    note: asString(obj.note),
    isActive: asBoolean(obj.isActive, true),

    sessions: rawSessions.map((session, index) =>
      normalizeSession(session, index)
    ),

    startedAt: asNullableString(obj.startedAt),
    endedAt: asNullableString(obj.endedAt),
    completedAt: asNullableString(obj.completedAt),
    createdAt: asString(obj.createdAt),
    updatedAt: asString(obj.updatedAt),
  };
}

function normalizeCourseOption(raw: unknown): CourseOption {
  const obj = isObject(raw) ? raw : {};

  return {
    _id: getId(obj),
    id: asString(obj.id),
    title: asString(obj.title),
  };
}

function normalizeTeacherOption(raw: unknown): TeacherOption {
  const obj = isObject(raw) ? raw : {};
  const user = normalizeTeacherUser(obj.user);
  const name =
    asString(obj.name) ||
    asString(isObject(obj.user) ? obj.user.name : undefined);
  const email =
    asString(obj.email) ||
    asString(isObject(obj.user) ? obj.user.email : undefined);
  const fallbackUser = user
    ? {
        ...user,
        name: user.name || name,
        email: user.email || email,
      }
    : name || email
      ? {
          _id: asString(obj.userId) || getId(obj),
          name,
          email,
        }
      : null;

  return {
    _id: getId(obj),
    id: asString(obj.id),
    name,
    email,
    specialty: asString(obj.specialty),
    avatar: asString(obj.avatar),
    user: fallbackUser,
  };
}

function requireItem(raw: unknown, message: string): AnyObj {
  const item = pickItem(raw);
  if (!item) throw new Error(message);
  return item;
}

export const classroomApi = {
  async list(query?: Record<string, string | number | boolean | undefined>) {
    const res = await http.get("/api/classes", { params: query });
    return pickArray(res.data).map(normalizeClassroom);
  },

  async listPaged(query?: {
    q?: string;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: SortDirection;
    page?: number;
    limit?: number;
    courseId?: string;
    teacherId?: string;
  }): Promise<ListResult<ClassroomItem>> {
    const res = await http.get("/api/classes", { params: query });
    const items = pickArray(res.data).map(normalizeClassroom);
    return {
      items,
      pagination: readPaginationMeta(res.data, items.length, query?.page, query?.limit),
    };
  },

  async listMinePaged(query?: {
    q?: string;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: SortDirection;
    page?: number;
    limit?: number;
    courseId?: string;
  }): Promise<ListResult<ClassroomItem>> {
    const res = await http.get("/api/classes/mine", { params: query });
    const items = pickArray(res.data).map(normalizeClassroom);
    return {
      items,
      pagination: readPaginationMeta(res.data, items.length, query?.page, query?.limit),
    };
  },

  async listDeleted(query?: {
    q?: string;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: SortDirection;
    page?: number;
    limit?: number;
    courseId?: string;
    teacherId?: string;
  }): Promise<ClassroomItem[]> {
    const res = await http.get("/api/classes/deleted", { params: query });
    return pickArray(res.data).map(normalizeClassroom);
  },

  async listDeletedPaged(query?: {
    q?: string;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: SortDirection;
    page?: number;
    limit?: number;
    courseId?: string;
    teacherId?: string;
  }): Promise<ListResult<ClassroomItem>> {
    const res = await http.get("/api/classes/deleted", { params: query });
    const items = pickArray(res.data).map(normalizeClassroom);
    return {
      items,
      pagination: readPaginationMeta(res.data, items.length, query?.page, query?.limit),
    };
  },

  async getById(id: string) {
    const res = await http.get(`/api/classes/${id}`);
    return normalizeClassroom(
      requireItem(res.data, "Không đọc được dữ liệu lớp học")
    );
  },

  async create(payload: CreateClassroomPayload) {
    const res = await http.post("/api/classes", payload);
    return normalizeClassroom(
      requireItem(res.data, "Không đọc được dữ liệu lớp học")
    );
  },

  async update(id: string, payload: UpdateClassroomPayload) {
    const res = await http.put(`/api/classes/${id}`, payload);
    return normalizeClassroom(
      requireItem(res.data, "Không đọc được dữ liệu lớp học")
    );
  },

  async softDelete(id: string) {
    const res = await http.delete(`/api/classes/${id}`);
    return res.data;
  },

  async restore(id: string) {
    const res = await http.patch(`/api/classes/${id}/restore`);
    return res.data;
  },

  async forceDelete(id: string) {
    const res = await http.delete(`/api/classes/${id}/force`);
    return res.data;
  },

  async listStudents(classRoomId: string) {
    const res = await http.get(`/api/classes/${classRoomId}/students`);
    return pickArray(res.data).map(normalizeStudentStudy);
  },

  async updateStudentStudy(
    studyId: string,
    payload: UpdateStudentStudyPayload
  ) {
    const res = await http.put(`/api/students/studies/${studyId}`, payload);
    return normalizeStudentStudy(
      requireItem(res.data, "Không đọc được dữ liệu học viên")
    );
  },

  async updateStudentLearning(
    studyId: string,
    payload: UpdateStudentLearningPayload
  ) {
    const res = await http.patch(
      `/api/classes/studies/${studyId}/learning`,
      payload
    );
    return normalizeStudentStudy(
      requireItem(res.data, "Không đọc được dữ liệu học viên")
    );
  },

  async updateStudentTests(
    studyId: string,
    payload: UpdateStudentTestsPayload
  ) {
    const res = await http.patch(
      `/api/classes/studies/${studyId}/tests`,
      payload
    );
    return normalizeStudentStudy(
      requireItem(res.data, "Không đọc được dữ liệu học viên")
    );
  },

  async updateStudentHonor(
    studyId: string,
    payload: UpdateStudentHonorPayload
  ) {
    const res = await http.patch(
      `/api/classes/studies/${studyId}/honor`,
      payload
    );
    return normalizeStudentStudy(
      requireItem(res.data, "Không đọc được dữ liệu học viên")
    );
  },

  async updateStudentSession(
    studyId: string,
    payload: UpdateStudentSessionPayload
  ) {
    const res = await http.patch(
      `/api/classes/studies/${studyId}/session`,
      payload
    );
    return normalizeStudentStudy(
      requireItem(res.data, "Không đọc được dữ liệu buổi học")
    );
  },

  async removeStudentStudy(studyId: string) {
    const res = await http.delete(`/api/students/studies/${studyId}`);
    return res.data;
  },

  async listCourseOptions() {
    const res = await http.get("/api/products");
    return pickArray(res.data)
      .map(normalizeCourseOption)
      .filter((item) => item._id && item.title);
  },

  async listTeacherOptions() {
    const res = await http.get("/api/teachers");
    return pickArray(res.data)
      .map(normalizeTeacherOption)
      .filter((item) => item._id);
  },
};
