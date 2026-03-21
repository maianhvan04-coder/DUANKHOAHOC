import { http } from "@/lib/utils/http";

export type StudyMode = "ONLINE" | "OFFLINE";
export type StudyStatus =
  | "ENROLLED"
  | "STUDYING"
  | "PAUSED"
  | "COMPLETED"
  | "DROPPED";

export type CompletionStatus = "NOT_COMPLETED" | "COMPLETED";
export type PerformanceStatus = "NORMAL" | "GOOD" | "EXCELLENT";

type AnyObj = Record<string, unknown>;

export type StudyStudent = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  active?: boolean;
  deletedAt?: string | null;
};

export type StudyTeacherUser = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
};

export type StudyTeacher = {
  _id?: string;
  id?: string;
  specialty?: string;
  avatar?: string;
  degree?: string;
  experience?: string;
  achievement?: string;
  rating?: number;
  user?: StudyTeacherUser | null;
};

export type StudyCourseCategory = {
  _id?: string;
  id?: string;
  name?: string;
};

export type StudyCourse = {
  _id?: string;
  id?: string;
  title?: string;
  slug?: string;
  shortDescription?: string;
  teacher?: string | StudyTeacher | null;
  teacherName?: string;
  image?: string;
  level?: string;
  modes?: string[];
  status?: string;
  rating?: number;
  studentCount?: number;
  durationText?: string;
  price?: number;
  originalPrice?: number;
  category?: string | StudyCourseCategory | null;
  isActive?: boolean;
  isDeleted?: boolean;
};

export type StudyClassRoom = {
  _id?: string;
  id?: string;
  className?: string;
  mode?: StudyMode;
  scheduleText?: string;
  room?: string;
  startedAt?: string | null;
  endedAt?: string | null;
  maxStudents?: number;
  isActive?: boolean;
  isDeleted?: boolean;
  course?: StudyCourse | string | null;
  teacher?: StudyTeacher | string | null;
};

export type StudentStudyItem = {
  _id: string;
  student?: StudyStudent | string | null;
  course?: StudyCourse | string | null;
  classRoom?: StudyClassRoom | string | null;
  teacher?: StudyTeacher | string | null;

  className: string;
  mode: StudyMode;
  scheduleText: string;
  room: string;

  status: StudyStatus;
  completionStatus: CompletionStatus;
  completedAt?: string | null;

  score: number;
  progressPercent: number;
  attendancePercent?: number;

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

export type CreateStudentStudyPayload = {
  classRoom: string;
  status?: StudyStatus;
  note?: string;
  isActive?: boolean | "true" | "false";
};

export type UpdateStudentStudyPayload = Partial<CreateStudentStudyPayload>;

export type UpdateStudentStudyLearningPayload = {
  score?: number | string;
  progressPercent?: number | string;
  attendancePercent?: number | string;
  status?: StudyStatus;
};

export type UpdateStudentStudyHonorPayload = {
  isHonored?: boolean;
  honorTitle?: string;
  showHonorOnUserPage?: boolean;
};

export type ClassRoomOption = {
  _id: string;
  className: string;
  mode?: StudyMode;
  scheduleText?: string;
  room?: string;
  startedAt?: string | null;
  endedAt?: string | null;
  isActive?: boolean;
  isDeleted?: boolean;
  course?: StudyCourse | string | null;
  teacher?: StudyTeacher | string | null;
};

function pickArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;

  if (raw && typeof raw === "object") {
    const obj = raw as AnyObj;
    if (Array.isArray(obj.items)) return obj.items as unknown[];
    if (Array.isArray(obj.data)) return obj.data as unknown[];
    if (Array.isArray(obj.products)) return obj.products as unknown[];
    if (Array.isArray(obj.courses)) return obj.courses as unknown[];
    if (Array.isArray(obj.classes)) return obj.classes as unknown[];
    if (Array.isArray(obj.classRooms)) return obj.classRooms as unknown[];
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

function normalizeTeacherUser(raw: unknown): StudyTeacherUser | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as AnyObj;

  return {
    _id: asString(obj._id),
    id: asString(obj.id),
    name: asString(obj.name),
    email: asString(obj.email),
  };
}

function normalizeTeacher(raw: unknown): StudyTeacher | null {
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

function normalizeStudent(raw: unknown): StudyStudent | null {
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

function normalizeCourse(raw: unknown): StudyCourse | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as AnyObj;

  return {
    _id: asString(obj._id),
    id: asString(obj.id),
    title: asString(obj.title),
    slug: asString(obj.slug),
    shortDescription: asString(obj.shortDescription),
    teacher:
      typeof obj.teacher === "string"
        ? obj.teacher
        : normalizeTeacher(obj.teacher),
    teacherName: asString(obj.teacherName),
    image: asString(obj.image),
    level: asString(obj.level),
    modes: Array.isArray(obj.modes) ? (obj.modes as string[]) : [],
    status: asString(obj.status),
    rating: asNumber(obj.rating, 0),
    studentCount: asNumber(obj.studentCount, 0),
    durationText: asString(obj.durationText),
    price: asNumber(obj.price, 0),
    originalPrice: asNumber(obj.originalPrice, 0),
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
    isActive: asBoolean(obj.isActive, true),
    isDeleted: asBoolean(obj.isDeleted, false),
  };
}

function normalizeClassRoom(raw: unknown): StudyClassRoom | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as AnyObj;

  return {
    _id: asString(obj._id),
    id: asString(obj.id),
    className: asString(obj.className),
    mode: (asString(obj.mode, "ONLINE") as StudyMode) || "ONLINE",
    scheduleText: asString(obj.scheduleText),
    room: asString(obj.room),
    startedAt: typeof obj.startedAt === "string" ? obj.startedAt : null,
    endedAt: typeof obj.endedAt === "string" ? obj.endedAt : null,
    maxStudents: asNumber(obj.maxStudents, 0),
    isActive: asBoolean(obj.isActive, true),
    isDeleted: asBoolean(obj.isDeleted, false),
    course:
      typeof obj.course === "string" ? obj.course : normalizeCourse(obj.course),
    teacher:
      typeof obj.teacher === "string"
        ? obj.teacher
        : normalizeTeacher(obj.teacher),
  };
}

function normalizeStudy(raw: unknown): StudentStudyItem {
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
        : normalizeClassRoom(obj.classRoom),
    teacher:
      typeof obj.teacher === "string"
        ? obj.teacher
        : normalizeTeacher(obj.teacher),

    className: asString(obj.className),
    mode: (asString(obj.mode, "ONLINE") as StudyMode) || "ONLINE",
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

function normalizeClassRoomOption(raw: unknown): ClassRoomOption {
  const obj = (raw || {}) as AnyObj;

  return {
    _id: asString(obj._id) || asString(obj.id),
    className: asString(obj.className),
    mode: (asString(obj.mode, "ONLINE") as StudyMode) || "ONLINE",
    scheduleText: asString(obj.scheduleText),
    room: asString(obj.room),
    startedAt: typeof obj.startedAt === "string" ? obj.startedAt : null,
    endedAt: typeof obj.endedAt === "string" ? obj.endedAt : null,
    isActive: asBoolean(obj.isActive, true),
    isDeleted: asBoolean(obj.isDeleted, false),
    course:
      typeof obj.course === "string" ? obj.course : normalizeCourse(obj.course),
    teacher:
      typeof obj.teacher === "string"
        ? obj.teacher
        : normalizeTeacher(obj.teacher),
  };
}

export const studentStudyApi = {
  async listByStudent(studentId: string) {
    const res = await http.get(`/api/students/${studentId}/studies`);
    return pickArray(res.data).map(normalizeStudy);
  },

  async listAll(query?: Record<string, string | number | boolean | undefined>) {
    const res = await http.get("/api/students/studies", { params: query });
    return pickArray(res.data).map(normalizeStudy);
  },

  async listByClassRoom(classRoomId: string) {
    const res = await http.get(`/api/classes/${classRoomId}/students`);
    return pickArray(res.data).map(normalizeStudy);
  },

  async create(studentId: string, payload: CreateStudentStudyPayload) {
    const res = await http.post(`/api/students/${studentId}/studies`, payload);
    const item = pickItem(res.data);
    if (!item) throw new Error("Không đọc được dữ liệu study");
    return normalizeStudy(item);
  },

  async update(studyId: string, payload: UpdateStudentStudyPayload) {
    const res = await http.put(`/api/students/studies/${studyId}`, payload);
    const item = pickItem(res.data);
    if (!item) throw new Error("Không đọc được dữ liệu study");
    return normalizeStudy(item);
  },

  async updateLearning(
    studyId: string,
    payload: UpdateStudentStudyLearningPayload
  ) {
    const res = await http.patch(`/api/classes/studies/${studyId}/learning`, payload);
    const item = pickItem(res.data);
    if (!item) throw new Error("Không đọc được dữ liệu study");
    return normalizeStudy(item);
  },

  async updateHonor(
    studyId: string,
    payload: UpdateStudentStudyHonorPayload
  ) {
    const res = await http.patch(`/api/classes/studies/${studyId}/honor`, payload);
    const item = pickItem(res.data);
    if (!item) throw new Error("Không đọc được dữ liệu study");
    return normalizeStudy(item);
  },

  async remove(studyId: string) {
    const res = await http.delete(`/api/students/studies/${studyId}`);
    return res.data;
  },

  async listClassRoomOptions() {
    const res = await http.get("/api/classes");
    return pickArray(res.data)
      .map(normalizeClassRoomOption)
      .filter((item) => item._id && item.className && item.isDeleted !== true);
  },
};