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
export type AcademicLevel =
  | "EXCELLENT"
  | "GOOD"
  | "AVERAGE"
  | "WEAK"
  | "POOR";

export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT";
export type HomeworkStatus = "DONE" | "MISSING";

type AnyObj = Record<string, unknown>;

export type StudyStudent = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
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
  image?: string;
  level?: string;
  modes?: string[];
  status?: string;
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

export type StudySessionItem = {
  sessionNo: number;
  date?: string | null;
  attendanceStatus: AttendanceStatus;
  homeworkStatus: HomeworkStatus;
  teacherNote: string;
  progressScore: number;
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
  attendancePercent: number;

  test1: number;
  test2: number;
  test3: number;
  finalAverage: number;
  academicLevel: AcademicLevel;

  sessions: StudySessionItem[];

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

export type PublicHonorStudyItem = {
  _id: string;
  studentId?: string;
  name: string;
  email?: string;
  avatar?: string;
  honorTitle: string;
  score: number;
  finalAverage: number;
  attendancePercent: number;
  progressPercent: number;
  className: string;
  courseTitle: string;
  teacherName: string;
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

export type UpdateStudentStudySessionPayload = {
  sessionNo: number;
  date?: string;
  attendanceStatus?: AttendanceStatus;
  homeworkStatus?: HomeworkStatus;
  teacherNote?: string;
  progressScore?: number | string;
};

export type UpdateStudentStudyTestsPayload = {
  test1?: number | string;
  test2?: number | string;
  test3?: number | string;
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

function isObject(value: unknown): value is AnyObj {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;

  if (isObject(raw)) {
    if (Array.isArray(raw.items)) return raw.items;
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.products)) return raw.products;
    if (Array.isArray(raw.courses)) return raw.courses;
    if (Array.isArray(raw.classes)) return raw.classes;
    if (Array.isArray(raw.classRooms)) return raw.classRooms;
    if (Array.isArray(raw.sessions)) return raw.sessions;
    if (Array.isArray(raw.students)) return raw.students;
    if (Array.isArray(raw.honors)) return raw.honors;
  }

  return [];
}

function pickItem(raw: unknown): AnyObj | null {
  if (!isObject(raw)) return null;

  if (isObject(raw.item)) return raw.item;
  if (isObject(raw.data)) return raw.data;

  return raw;
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

function getId(value: unknown): string {
  if (!isObject(value)) return "";
  return asString(value._id) || asString(value.id);
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

function normalizeStudent(raw: unknown): StudyStudent | null {
  if (!isObject(raw)) return null;

  return {
    _id: asString(raw._id),
    id: asString(raw.id),
    name: asString(raw.name),
    email: asString(raw.email),
    avatar: asString(raw.avatar),
    role: asString(raw.role),
    active: asBoolean(raw.active, true),
    deletedAt: typeof raw.deletedAt === "string" ? raw.deletedAt : null,
  };
}

function normalizeCourse(raw: unknown): StudyCourse | null {
  if (!isObject(raw)) return null;

  return {
    _id: asString(raw._id),
    id: asString(raw.id),
    title: asString(raw.title),
    slug: asString(raw.slug),
    shortDescription: asString(raw.shortDescription),
    image: asString(raw.image),
    level: asString(raw.level),
    modes: Array.isArray(raw.modes)
      ? raw.modes.filter((item): item is string => typeof item === "string")
      : [],
    status: asString(raw.status),
    studentCount: asNumber(raw.studentCount, 0),
    durationText: asString(raw.durationText),
    price: asNumber(raw.price, 0),
    originalPrice: asNumber(raw.originalPrice, 0),
    category:
      isObject(raw.category)
        ? {
            _id: asString(raw.category._id),
            id: asString(raw.category.id),
            name: asString(raw.category.name),
          }
        : typeof raw.category === "string"
          ? raw.category
          : null,
    isActive: asBoolean(raw.isActive, true),
    isDeleted: asBoolean(raw.isDeleted, false),
  };
}

function normalizeClassRoom(raw: unknown): StudyClassRoom | null {
  if (!isObject(raw)) return null;

  return {
    _id: asString(raw._id),
    id: asString(raw.id),
    className: asString(raw.className),
    mode: (asString(raw.mode, "ONLINE") as StudyMode) || "ONLINE",
    scheduleText: asString(raw.scheduleText),
    room: asString(raw.room),
    startedAt: typeof raw.startedAt === "string" ? raw.startedAt : null,
    endedAt: typeof raw.endedAt === "string" ? raw.endedAt : null,
    maxStudents: asNumber(raw.maxStudents, 0),
    isActive: asBoolean(raw.isActive, true),
    isDeleted: asBoolean(raw.isDeleted, false),
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
    attendanceStatus:
      (asString(obj.attendanceStatus, "ABSENT") as AttendanceStatus) || "ABSENT",
    homeworkStatus:
      (asString(obj.homeworkStatus, "MISSING") as HomeworkStatus) || "MISSING",
    teacherNote: asString(obj.teacherNote),
    progressScore: asNumber(obj.progressScore, 0),
  };
}

function normalizeStudy(raw: unknown): StudentStudyItem {
  const obj = isObject(raw) ? raw : {};

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
      (asString(obj.completionStatus, "NOT_COMPLETED") as CompletionStatus) ||
      "NOT_COMPLETED",
    completedAt: typeof obj.completedAt === "string" ? obj.completedAt : null,

    score: asNumber(obj.score, 0),
    progressPercent: asNumber(obj.progressPercent, 0),
    attendancePercent: asNumber(obj.attendancePercent, 0),

    test1: asNumber(obj.test1, 0),
    test2: asNumber(obj.test2, 0),
    test3: asNumber(obj.test3, 0),
    finalAverage: asNumber(obj.finalAverage, 0),
    academicLevel:
      (asString(obj.academicLevel, "AVERAGE") as AcademicLevel) || "AVERAGE",

    sessions: pickArray(obj.sessions).map(normalizeSession),

    rank: obj.rank == null ? null : asNumber(obj.rank, 0),
    performanceStatus:
      (asString(obj.performanceStatus, "NORMAL") as PerformanceStatus) ||
      "NORMAL",
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

function normalizePublicHonor(raw: unknown): PublicHonorStudyItem {
  const obj = isObject(raw) ? raw : {};

  const student = isObject(obj.student) ? obj.student : null;
  const course = isObject(obj.course) ? obj.course : null;
  const teacher = isObject(obj.teacher) ? obj.teacher : null;
  const teacherUser = teacher && isObject(teacher.user) ? teacher.user : null;

  return {
    _id: asString(obj._id) || asString(obj.id) || getId(student),
    studentId: getId(student),
    name: asString(student?.name) || asString(obj.studentName) || "Học viên",
    email: asString(student?.email),
    avatar: asString(student?.avatar) || asString(obj.avatar),
    honorTitle: asString(obj.honorTitle, "Học viên xuất sắc"),
    score: asNumber(obj.score, 0),
    finalAverage: asNumber(obj.finalAverage, 0),
    attendancePercent: asNumber(obj.attendancePercent, 0),
    progressPercent: asNumber(obj.progressPercent, 0),
    className: asString(obj.className),
    courseTitle: asString(course?.title) || asString(obj.courseTitle),
    teacherName:
      asString(teacherUser?.name) || asString(obj.teacherName) || "Giảng viên",
  };
}

function normalizeClassRoomOption(raw: unknown): ClassRoomOption {
  const obj = isObject(raw) ? raw : {};

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

  async getPublicHonors() {
    const res = await http.get("/api/students/public/honors");
    return pickArray(res.data).map(normalizePublicHonor);
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
    const res = await http.patch(
      `/api/students/studies/${studyId}/learning`,
      payload
    );
    const item = pickItem(res.data);
    if (!item) throw new Error("Không đọc được dữ liệu study");
    return normalizeStudy(item);
  },

  async updateSession(
    studyId: string,
    payload: UpdateStudentStudySessionPayload
  ) {
    const res = await http.patch(
      `/api/students/studies/${studyId}/session`,
      payload
    );
    const item = pickItem(res.data);
    if (!item) throw new Error("Không đọc được dữ liệu study");
    return normalizeStudy(item);
  },

  async updateTests(
    studyId: string,
    payload: UpdateStudentStudyTestsPayload
  ) {
    const res = await http.patch(
      `/api/students/studies/${studyId}/tests`,
      payload
    );
    const item = pickItem(res.data);
    if (!item) throw new Error("Không đọc được dữ liệu study");
    return normalizeStudy(item);
  },

  async updateHonor(
    studyId: string,
    payload: UpdateStudentStudyHonorPayload
  ) {
    const res = await http.patch(
      `/api/students/studies/${studyId}/honor`,
      payload
    );
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
