import { Schema, model, Types } from "mongoose";

export type StudyMode = "ONLINE" | "OFFLINE";
export type StudyStatus =
  | "ENROLLED"
  | "STUDYING"
  | "PAUSED"
  | "COMPLETED"
  | "DROPPED";

export type CompletionStatus = "NOT_COMPLETED" | "COMPLETED";
export type PerformanceStatus = "NORMAL" | "GOOD" | "EXCELLENT";

export interface StudentStudy {
  student: Types.ObjectId;
  course: Types.ObjectId;
  classRoom: Types.ObjectId;
  teacher: Types.ObjectId | null;

  className: string;
  mode: StudyMode;
  scheduleText: string;
  room: string;

  status: StudyStatus;
  completionStatus: CompletionStatus;
  completedAt: Date | null;

  score: number;
  progressPercent: number;
  attendancePercent: number;

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

const studentStudySchema = new Schema<StudentStudy>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    course: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    classRoom: {
      type: Schema.Types.ObjectId,
      ref: "ClassRoom",
      required: true,
      index: true,
    },

    teacher: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
      index: true,
    },

    className: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    mode: {
      type: String,
      enum: ["ONLINE", "OFFLINE"],
      default: "ONLINE",
      index: true,
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
      index: true,
    },

    progressPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      index: true,
    },

    attendancePercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      index: true,
    },

    rank: {
      type: Number,
      default: null,
      min: 1,
      index: true,
    },

    performanceStatus: {
      type: String,
      enum: ["NORMAL", "GOOD", "EXCELLENT"],
      default: "NORMAL",
      index: true,
    },

    isHonored: {
      type: Boolean,
      default: false,
      index: true,
    },

    honorTitle: {
      type: String,
      default: "",
      trim: true,
    },

    showHonorOnUserPage: {
      type: Boolean,
      default: false,
      index: true,
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
  }
);

studentStudySchema.index({
  student: 1,
  classRoom: 1,
});

export const StudentStudyModel = model<StudentStudy>(
  "StudentStudy",
  studentStudySchema
);