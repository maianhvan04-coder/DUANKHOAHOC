import {
  Schema,
  model,
  Types,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

const userRoleSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    roleId: {
      type: Types.ObjectId,
      ref: "Role",
      required: true,
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

userRoleSchema.index(
  { userId: 1, roleId: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

export type UserRoleEntity = InferSchemaType<typeof userRoleSchema>;
export type UserRoleDocument = HydratedDocument<UserRoleEntity>;

const UserRole = model<UserRoleEntity>("UserRole", userRoleSchema);

export default UserRole;