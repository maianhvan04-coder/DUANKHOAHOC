import { Schema, model } from "mongoose";
import { ROLES } from "../../constants/roles";

const userSchema = new Schema(
  {
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
      index: true,
    },

    passwordHash: {
      type: String,
      default: null,
    },

    avatar: {
      type: String,
      default: null,
    },

    avatarPublicId: {
      type: String,
      default: null,
    },

    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER,
      required: true,
      index: true,
    },

    active: {
      type: Boolean,
      default: true,
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

userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: null },
  }
);

export const UserModel = model("User", userSchema);