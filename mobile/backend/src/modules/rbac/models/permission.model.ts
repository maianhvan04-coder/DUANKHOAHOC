import {
  Schema,
  model,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

const permissionSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    resource: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    groupKey: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    groupLabel: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
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
    },
  },
  { timestamps: true }
);

permissionSchema.index(
  { key: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

export type PermissionEntity = InferSchemaType<typeof permissionSchema>;
export type PermissionDocument = HydratedDocument<PermissionEntity>;

const Permission = model<PermissionEntity>("Permission", permissionSchema);

export default Permission;