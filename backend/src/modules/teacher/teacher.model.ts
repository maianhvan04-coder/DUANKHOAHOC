import { Schema, model, Types } from "mongoose";

export interface Teacher {
  user: Types.ObjectId;
  specialty: string;
  phone: string;
  avatar: string;
  avatarPublicId: string;

  degree: string;
  experience: string;
  achievement: string;

  bio: string; // giữ tạm để tương thích dữ liệu cũ

  rating: number;
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

    degree: {
      type: String,
      default: "",
      trim: true,
    },

    experience: {
      type: String,
      default: "",
      trim: true,
    },

    achievement: {
      type: String,
      default: "",
      trim: true,
    },

    bio: {
      type: String,
      default: "",
      trim: true,
    },

    rating: {
      type: Number,
      default: 4.8,
      min: 0,
      max: 5,
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