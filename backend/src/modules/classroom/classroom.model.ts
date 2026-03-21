import { Schema, model, Types } from "mongoose";

export type ClassMode = "ONLINE" | "OFFLINE";

export interface ClassRoom {
  course: Types.ObjectId;
  teacher: Types.ObjectId;

  className: string;
  mode: ClassMode;
  scheduleText: string;
  room: string;

  startedAt: Date | null;
  endedAt: Date | null;

  maxStudents: number;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const classRoomSchema = new Schema<ClassRoom>(
  {
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

    startedAt: {
      type: Date,
      default: null,
    },

    endedAt: {
      type: Date,
      default: null,
    },

    maxStudents: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

classRoomSchema.index(
  { course: 1, className: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

export const ClassRoomModel = model<ClassRoom>("ClassRoom", classRoomSchema);