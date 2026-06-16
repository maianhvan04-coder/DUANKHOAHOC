import { Schema, model, Types } from "mongoose";
import { UserModel } from "../user/user.model";

export interface Student {
  user: Types.ObjectId;
  role: "STUDENT";
  name: string;
  email: string;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<Student>(
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
      enum: ["STUDENT"],
      default: "STUDENT",
      required: true,
      immutable: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
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
  {
    timestamps: true,
    versionKey: false,
  }
);

studentSchema.pre("validate", async function () {
  if (!this.user) return;

  const user = await UserModel.findOne({
    _id: this.user,
    role: "STUDENT",
  })
    .session(this.$session())
    .select("_id")
    .lean();

  if (!user) {
    throw new Error(
      "Chỉ tài khoản có role STUDENT mới được tạo hồ sơ học viên"
    );
  }
});

export const StudentModel = model<Student>("Student", studentSchema);
