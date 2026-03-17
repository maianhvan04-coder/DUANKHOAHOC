import { Schema, model } from "mongoose";

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // soft delete
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

// chỉ unique với category chưa bị xóa mềm
categorySchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

export const CategoryModel = model("Category", categorySchema);