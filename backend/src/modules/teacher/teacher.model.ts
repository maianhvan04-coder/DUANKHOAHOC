import { Schema, model, Types } from "mongoose";

export interface Teacher {
  user: Types.ObjectId;
  role: "TEACHER";
  name: string;
  email: string;
  specialty: string;
  phone: string;
  avatar: string;
  avatarPublicId: string;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const teacherSchema = new Schema<Teacher>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    role: {
      type: String,
      required: true,
      enum: ["TEACHER"],
      default: "TEACHER",
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    specialty: {
      type: String,
      default: "",
      trim: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    avatar: {
      type: String,
      default: "",
      trim: true,
    },

    avatarPublicId: {
      type: String,
      default: "",
      trim: true,
      index: true,
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
      index: true,
    },
  },
  { timestamps: true }
);

export const TeacherModel = model<Teacher>("Teacher", teacherSchema);
