// src/modules/role/models/userRole.model.ts

import { Schema, model, Types } from "mongoose";

const userRoleSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    roleId: { type: Types.ObjectId, ref: "Role", required: true, index: true },

    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ✅ unique chỉ áp dụng cho bản ghi chưa xóa mềm
userRoleSchema.index(
  { userId: 1, roleId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export const UserRole = model("UserRole", userRoleSchema);