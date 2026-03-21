import { http } from "@/lib/utils/http";

export type ClassMode = "ONLINE" | "OFFLINE";
export type StudyStatus =
  | "ENROLLED"
  | "STUDYING"
  | "PAUSED"
  | "COMPLETED"
  | "DROPPED";

export type CompletionStatus = "NOT_COMPLETED" | "COMPLETED";
export type PerformanceStatus = "NORMAL" | "GOOD" | "EXCELLENT";

type AnyObj = Record<string, unknown>;

export type ClassroomTeacherUser = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
};

export type ClassroomTeacher = {
  _id?: string;
  id?: string;
  specialty?: string;
  avatar?: string;
  degree?: string;
  experience?: string;
  achievement?: string;
  rating?: number;
  user?: ClassroomTeacherUser | null;
};

export type ClassroomCategory = {
  _id?: string;
  id?: string;
  name?: string;
};

export type ClassroomCourse = {
  _id?: string;
  id?: string;
  title?: string;
  slug?: string;
  teacher?: string | ClassroomTeacher | null;
  teacherName?: string;
  image?: string;
  level?: string;
  status?: string;
  category?: string | ClassroomCategory | null;
};

export type ClassroomStudent = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  active?: boolean;
  deletedAt?: string | null;
};

export type ClassroomItem = {
  _id: string;
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
  student?: ClassroomStudent | string | null;
  course?: ClassroomCourse | string | null;
  classRoom?: ClassroomItem | string | null;
  teacher?: ClassroomTeacher | string | null;

  className: string;
  mode: ClassMode;
  scheduleText: string;
  room: string;

  status: StudyStatus;
  completionStatus: CompletionStatus;
  completedAt?: string | null;

  score: number;
  progressPercent: number;
  attendancePercent: number;

  rank?: number | null;
  performanceStatus: PerformanceStatus;
  isHonored: boolean;
  honorTitle: string;
  showHonorOnUserPage: boolean;

  startedAt?: string | null;
  endedAt?: string | null;
  note: string;
  isActive: boolean;

  createdAt?: string;
  updatedAt?: string;
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
  maxStudents?: number | string;
  isActive?: boolean | "true" | "false";
};

export type UpdateClassroomPayload = Partial<CreateClassroomPayload>;

export type UpdateStudentLearningPayload = {
  score?: number | string;
  progressPercent?: number | string;
  attendancePercent?: number | string;
  status?: StudyStatus;
};

export type UpdateStudentHonorPayload = {
  isHonored?: boolean;
  honorTitle?: string;
  showHonorOnUserPage?: boolean;
};

export type CourseOption = {
  _id: string;
  title: string;
};

export type TeacherOptionUser = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
};

export type TeacherOption = {
  _id: string;
  specialty?: string;
  avatar?: string;
  degree?: string;
  experience?: string;
  rating?: number;
  user?: TeacherOptionUser | null;
};

function pickArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;

  if (raw && typeof raw === "object") {
    const obj = raw as AnyObj;
    if (Array.isArray(obj.items)) return obj.items as unknown[];
    if (Array.isArray(obj.data)) return obj.data as unknown[];
    if (Array.isArray(obj.products)) return obj.products as unknown[];
    if (Array.isArray(obj.courses)) return obj.courses as unknown[];
    if (Array.isArray(obj.teachers)) return obj.teachers as unknown[];
    if (Array.isArray(obj.students)) return obj.students as unknown[];
  }

  return [];
}

function pickItem(raw: unknown): AnyObj | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as AnyObj;

  if (obj.item && typeof obj.item === "object") return obj.item as AnyObj;
  if (obj.data && typeof obj.data === "object") return obj.data as AnyObj;
  return obj;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function normalizeTeacherUser(raw: unknown): ClassroomTeacherUser | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as AnyObj;

  return {
    _id: asString(obj._id),
    id: asString(obj.id),
    name: asString(obj.name),
    email: asString(obj.email),
  };
}

function normalizeTeacher(raw: unknown): ClassroomTeacher | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as AnyObj;

  return {
    _id: asString(obj._id),
    id: asString(obj.id),
    specialty: asString(obj.specialty),
    avatar: asString(obj.avatar),
    degree: asString(obj.degree),
    experience: asString(obj.experience),
    achievement: asString(obj.achievement),
    rating: asNumber(obj.rating, 0),
    user: normalizeTeacherUser(obj.user),
  };
}

function normalizeCourse(raw: unknown): ClassroomCourse | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as AnyObj;

  return {
    _id: asString(obj._id),
    id: asString(obj.id),
    title: asString(obj.title),
    slug: asString(obj.slug),
    teacher:
      typeof obj.teacher === "string"
        ? obj.teacher
        : normalizeTeacher(obj.teacher),
    teacherName: asString(obj.teacherName),
    image: asString(obj.image),
    level: asString(obj.level),
    status: asString(obj.status),
    category:
      obj.category && typeof obj.category === "object"
        ? {
            _id: asString((obj.category as AnyObj)._id),
            id: asString((obj.category as AnyObj).id),
            name: asString((obj.category as AnyObj).name),
          }
        : typeof obj.category === "string"
          ? obj.category
          : null,
  };
}

function normalizeStudent(raw: unknown): ClassroomStudent | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as AnyObj;

  return {
    _id: asString(obj._id),
    id: asString(obj.id),
    name: asString(obj.name),
    email: asString(obj.email),
    role: asString(obj.role),
    active: asBoolean(obj.active, true),
    deletedAt: typeof obj.deletedAt === "string" ? obj.deletedAt : null,
  };
}

function normalizeClassroom(raw: unknown): ClassroomItem {
  const obj = (raw || {}) as AnyObj;

  return {
    _id: asString(obj._id) || asString(obj.id),
    course:
      typeof obj.course === "string" ? obj.course : normalizeCourse(obj.course),
    teacher:
      typeof obj.teacher === "string"
        ? obj.teacher
        : normalizeTeacher(obj.teacher),
    className: asString(obj.className),
    mode: (asString(obj.mode, "ONLINE") as ClassMode) || "ONLINE",
    scheduleText: asString(obj.scheduleText),
    room: asString(obj.room),
    startedAt: typeof obj.startedAt === "string" ? obj.startedAt : null,
    endedAt: typeof obj.endedAt === "string" ? obj.endedAt : null,
    maxStudents: asNumber(obj.maxStudents, 0),
    isActive: asBoolean(obj.isActive, true),
    isDeleted: asBoolean(obj.isDeleted, false),
    deletedAt: typeof obj.deletedAt === "string" ? obj.deletedAt : null,
    createdAt: asString(obj.createdAt),
    updatedAt: asString(obj.updatedAt),
  };
}

function normalizeStudentStudy(raw: unknown): ClassroomStudentStudyItem {
  const obj = (raw || {}) as AnyObj;

  return {
    _id: asString(obj._id) || asString(obj.id),
    student:
      typeof obj.student === "string"
        ? obj.student
        : normalizeStudent(obj.student),
    course:
      typeof obj.course === "string" ? obj.course : normalizeCourse(obj.course),
    classRoom:
      typeof obj.classRoom === "string"
        ? obj.classRoom
        : normalizeClassroom(obj.classRoom),
    teacher:
      typeof obj.teacher === "string"
        ? obj.teacher
        : normalizeTeacher(obj.teacher),

    className: asString(obj.className),
    mode: (asString(obj.mode, "ONLINE") as ClassMode) || "ONLINE",
    scheduleText: asString(obj.scheduleText),
    room: asString(obj.room),

    status: (asString(obj.status, "ENROLLED") as StudyStatus) || "ENROLLED",
    completionStatus:
      (asString(
        obj.completionStatus,
        "NOT_COMPLETED"
      ) as CompletionStatus) || "NOT_COMPLETED",
    completedAt: typeof obj.completedAt === "string" ? obj.completedAt : null,

    score: asNumber(obj.score, 0),
    progressPercent: asNumber(obj.progressPercent, 0),
    attendancePercent: asNumber(obj.attendancePercent, 0),

    rank: obj.rank == null ? null : asNumber(obj.rank, 0),
    performanceStatus:
      (asString(
        obj.performanceStatus,
        "NORMAL"
      ) as PerformanceStatus) || "NORMAL",
    isHonored: asBoolean(obj.isHonored, false),
    honorTitle: asString(obj.honorTitle),
    showHonorOnUserPage: asBoolean(obj.showHonorOnUserPage, false),

    startedAt: typeof obj.startedAt === "string" ? obj.startedAt : null,
    endedAt: typeof obj.endedAt === "string" ? obj.endedAt : null,
    note: asString(obj.note),
    isActive: asBoolean(obj.isActive, true),

    createdAt: asString(obj.createdAt),
    updatedAt: asString(obj.updatedAt),
  };
}

function normalizeCourseOption(raw: unknown): CourseOption {
  const obj = (raw || {}) as AnyObj;
  return {
    _id: asString(obj._id) || asString(obj.id),
    title: asString(obj.title),
  };
}

function normalizeTeacherOption(raw: unknown): TeacherOption {
  const obj = (raw || {}) as AnyObj;
  return {
    _id: asString(obj._id) || asString(obj.id),
    specialty: asString(obj.specialty),
    avatar: asString(obj.avatar),
    degree: asString(obj.degree),
    experience: asString(obj.experience),
    rating: asNumber(obj.rating, 0),
    user: normalizeTeacherUser(obj.user),
  };
}

export const classroomApi = {
  async list(query?: Record<string, string | number | boolean | undefined>) {
    const res = await http.get("/api/classes", { params: query });
    return pickArray(res.data).map(normalizeClassroom);
  },

  async listDeleted() {
    const res = await http.get("/api/classes/deleted");
    return pickArray(res.data).map(normalizeClassroom);
  },

  async getById(id: string) {
    const res = await http.get(`/api/classes/${id}`);
    const item = pickItem(res.data);
    if (!item) throw new Error("Không đọc được dữ liệu lớp");
    return normalizeClassroom(item);
  },

  async create(payload: CreateClassroomPayload) {
    const res = await http.post("/api/classes", payload);
    const item = pickItem(res.data);
    if (!item) throw new Error("Không đọc được dữ liệu lớp");
    return normalizeClassroom(item);
  },

  async update(id: string, payload: UpdateClassroomPayload) {
    const res = await http.put(`/api/classes/${id}`, payload);
    const item = pickItem(res.data);
    if (!item) throw new Error("Không đọc được dữ liệu lớp");
    return normalizeClassroom(item);
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

  async updateStudentLearning(
    studyId: string,
    payload: UpdateStudentLearningPayload
  ) {
    const res = await http.patch(`/api/classes/studies/${studyId}/learning`, payload);
    const item = pickItem(res.data);
    if (!item) throw new Error("Không đọc được dữ liệu học viên trong lớp");
    return normalizeStudentStudy(item);
  },

  async updateStudentHonor(
    studyId: string,
    payload: UpdateStudentHonorPayload
  ) {
    const res = await http.patch(`/api/classes/studies/${studyId}/honor`, payload);
    const item = pickItem(res.data);
    if (!item) throw new Error("Không đọc được dữ liệu học viên trong lớp");
    return normalizeStudentStudy(item);
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