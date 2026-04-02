import { Schema, model, Types } from "mongoose";

export type StudyStatus =
  | "ENROLLED"
  | "STUDYING"
  | "PAUSED"
  | "COMPLETED"
  | "DROPPED";

export type CompletionStatus = "NOT_COMPLETED" | "COMPLETED";

export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT";

export type HomeworkStatus = "DONE" | "MISSING";

export type PerformanceStatus = "NORMAL" | "GOOD" | "EXCELLENT";

export type AcademicLevel =
  | "EXCELLENT"
  | "GOOD"
  | "AVERAGE"
  | "WEAK"
  | "POOR";

export type ClassMode = "ONLINE" | "OFFLINE";

export interface StudySession {
  sessionNo: number;
  date: Date | null;
  attendanceStatus: AttendanceStatus;
  homeworkStatus: HomeworkStatus;
  teacherNote: string;
  progressScore: number;
}

export interface StudentStudy {
  student: Types.ObjectId;
  classRoom: Types.ObjectId;
  course: Types.ObjectId;
  teacher: Types.ObjectId;

  className: string;
  mode: ClassMode;
  scheduleText: string;
  room: string;

  status: StudyStatus;
  completionStatus: CompletionStatus;
  completedAt: Date | null;

  score: number;
  progressPercent: number;
  attendancePercent: number;

  test1: number;
  test2: number;
  test3: number;
  finalAverage: number;
  academicLevel: AcademicLevel;

  sessions: StudySession[];

  rank: number | null;
  performanceStatus: PerformanceStatus;
  isHonored: boolean;
  honorTitle: string;
  showHonorOnUserPage: boolean;

  startedAt: Date | null;
  endedAt: Date | null;

  note: string;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const studySessionSchema = new Schema<StudySession>(
  {
    sessionNo: {
      type: Number,
      required: true,
      min: 1,
      max: 30,
    },
    date: {
      type: Date,
      default: null,
    },
    attendanceStatus: {
      type: String,
      enum: ["PRESENT", "LATE", "ABSENT"],
      default: "ABSENT",
    },
    homeworkStatus: {
      type: String,
      enum: ["DONE", "MISSING"],
      default: "MISSING",
    },
    teacherNote: {
      type: String,
      default: "",
      trim: true,
    },
    progressScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    _id: true,
    versionKey: false,
  }
);

const studentStudySchema = new Schema<StudentStudy>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    classRoom: {
      type: Schema.Types.ObjectId,
      ref: "ClassRoom",
      required: true,
      index: true,
    },

    course: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    teacher: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
      index: true,
    },

    className: {
      type: String,
      required: true,
      trim: true,
    },

    mode: {
      type: String,
      enum: ["ONLINE", "OFFLINE"],
      default: "ONLINE",
    },

    scheduleText: {
      type: String,
      default: "",
      trim: true,
    },

    room: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["ENROLLED", "STUDYING", "PAUSED", "COMPLETED", "DROPPED"],
      default: "ENROLLED",
      index: true,
    },

    completionStatus: {
      type: String,
      enum: ["NOT_COMPLETED", "COMPLETED"],
      default: "NOT_COMPLETED",
      index: true,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    progressPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    attendancePercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    test1: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },

    test2: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },

    test3: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },

    finalAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },

    academicLevel: {
      type: String,
      enum: ["EXCELLENT", "GOOD", "AVERAGE", "WEAK", "POOR"],
      default: "AVERAGE",
    },

    sessions: {
      type: [studySessionSchema],
      default: [],
    },

    rank: {
      type: Number,
      default: null,
    },

    performanceStatus: {
      type: String,
      enum: ["NORMAL", "GOOD", "EXCELLENT"],
      default: "NORMAL",
    },

    isHonored: {
      type: Boolean,
      default: false,
    },

    honorTitle: {
      type: String,
      default: "",
      trim: true,
    },

    showHonorOnUserPage: {
      type: Boolean,
      default: false,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    endedAt: {
      type: Date,
      default: null,
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

studentStudySchema.index(
  { student: 1, classRoom: 1 },
  {
    unique: true,
  }
);

studentStudySchema.index({ classRoom: 1, score: -1, updatedAt: 1 });
studentStudySchema.index({ isHonored: 1, showHonorOnUserPage: 1, isActive: 1 });

export const StudentStudyModel = model<StudentStudy>(
  "StudentStudy",
  studentStudySchema
);