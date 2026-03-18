import {
  Schema,
  model,
  Types,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

const rolePermissionSchema = new Schema(
  {
    roleId: {
      type: Types.ObjectId,
      ref: "Role",
      required: true,
      index: true,
    },
    permissionKey: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    scope: {
      type: String,
      default: "all",
      trim: true,
      lowercase: true,
    },
    field: {
      type: String,
      default: null,
      trim: true,
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

rolePermissionSchema.index(
  { roleId: 1, permissionKey: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

export type RolePermissionEntity = InferSchemaType<typeof rolePermissionSchema>;
export type RolePermissionDocument = HydratedDocument<RolePermissionEntity>;

const RolePermission = model<RolePermissionEntity>(
  "RolePermission",
  rolePermissionSchema
);

export default RolePermission;