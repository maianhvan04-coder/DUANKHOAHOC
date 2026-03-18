import { Types } from "mongoose";
import Permission from "./models/permission.model";
import RoleModel from "./models/role.model";
import RolePermission from "./models/rolePermission.model";
import { UserModel } from "../user/user.model";

function toObjectId(value: string | Types.ObjectId): Types.ObjectId {
  return typeof value === "string" ? new Types.ObjectId(value) : value;
}

export const rbacRepo = {
  listRoles() {
    return RoleModel.find({
      isDeleted: false,
    })
      .sort({ priority: -1, code: 1 })
      .lean();
  },

  listPermissions() {
    return Permission.find({
      isDeleted: false,
      isActive: true,
    })
      .sort({ order: 1, key: 1 })
      .lean();
  },

  findRoleByCode(roleCode: string) {
    return RoleModel.findOne({
      code: String(roleCode).trim().toUpperCase(),
      isDeleted: false,
      isActive: true,
    }).lean();
  },

  async getRolePermissionKeys(roleId: string | Types.ObjectId): Promise<string[]> {
    const keys = await RolePermission.distinct("permissionKey", {
      roleId: toObjectId(roleId),
      isDeleted: false,
    });

    return keys as string[];
  },

  findPermissionsByKeys(keys: string[]) {
    const normalizedKeys = [...new Set(keys.map((item) => String(item).trim().toLowerCase()))];

    return Permission.find({
      key: { $in: normalizedKeys },
      isDeleted: false,
      isActive: true,
    })
      .sort({ order: 1, key: 1 })
      .lean();
  },

  findUserBasicById(userId: string) {
    return UserModel.findById(userId)
      .select("_id name email role active deletedAt")
      .lean();
  },
};