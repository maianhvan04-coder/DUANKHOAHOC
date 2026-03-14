// src/modules/role/models/role.model.ts

import { Schema, model, type InferSchemaType } from "mongoose";

const roleSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, index: true }, // ✅ required
    name: { type: String, default: "" },
    description: { type: String, default: "", trim: true },

    type: {
      type: String,
      enum: ["admin", "manager", "staff", "user", "guest"],
      default: "user",
      index: true,
    },

    priority: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },

    // ✅ đồng bộ với repo: isDeleted (đừng dùng isDelete)
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export type RoleDocument = InferSchemaType<typeof roleSchema> & {
  _id: import("mongoose").Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Role = model<RoleDocument>("Role", roleSchema);