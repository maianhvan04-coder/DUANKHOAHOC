import { Schema, model } from "mongoose";
import { ROLES } from "../../constants/roles";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },

    // để auth dùng (user tạo từ CRUD có thể chưa có password)
    passwordHash: { type: String, default: null },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.USER },

    // ✅ status
    active: { type: Boolean, default: true },

    // ✅ soft delete flag (null = chưa xoá, có date = đã xoá)
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const UserModel = model("User", userSchema);