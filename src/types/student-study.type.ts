export type StudyMode = "ONLINE" | "OFFLINE";

export type StudyStatus =
  | "ENROLLED"
  | "STUDYING"
  | "PAUSED"
  | "COMPLETED"
  | "DROPPED";

export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT";
export type HomeworkStatus = "DONE" | "MISSING";

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

export type StudyCourse = {
  _id?: string;
  id?: string;
  title?: string;
  slug?: string;
  level?: string;
  image?: string;
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
  course?: StudyCourse | string | null;
  classRoom?: StudyClassRoom | string | null;
  teacher?: StudyTeacher | string | null;
  className: string;
  mode: StudyMode;
  scheduleText: string;
  room: string;
  status: StudyStatus;
  score: number;
  progressPercent: number;
  attendancePercent: number;
  test1: number;
  test2: number;
  test3: number;
  finalAverage: number;
  sessions: StudySessionItem[];
  startedAt?: string | null;
  endedAt?: string | null;
  note: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};
