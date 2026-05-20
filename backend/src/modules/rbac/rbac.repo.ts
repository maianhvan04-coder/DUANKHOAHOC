import { Types } from "mongoose";
import Permission from "./models/permission.model";
import RoleModel from "./models/role.model";
import RolePermission from "./models/rolePermission.model";
import UserRole from "./models/userRole.model";
import { UserModel } from "../user/user.model";

function toObjectId(value: string | Types.ObjectId): Types.ObjectId {
  return typeof value === "string" ? new Types.ObjectId(value) : value;
}

export const rbacRepo = {
  async listRoles() {
    const roles = await RoleModel.find({
      isDeleted: false,
    })
      .sort({ priority: -1, code: 1 })
      .lean();

    if (!roles.length) return roles;

    const roleIds = roles.map((role) => role._id);
    const roleCodes = roles.map((role) => String(role.code).trim().toUpperCase());
    const roleIdByCode = new Map(
      roles.map((role) => [String(role.code).trim().toUpperCase(), String(role._id)])
    );
    const userIdsByRoleId = new Map<string, Set<string>>(
      roles.map((role) => [String(role._id), new Set<string>()])
    );

    const roleAssignments = await UserRole.find({
      roleId: { $in: roleIds },
      isDeleted: false,
    })
      .select("roleId userId")
      .lean();

    for (const assignment of roleAssignments) {
      const roleId = String(assignment.roleId);
      const users = userIdsByRoleId.get(roleId);

      if (users) {
        users.add(String(assignment.userId));
      }
    }

    const legacyUsers = await UserModel.find({
      role: { $in: roleCodes },
      deletedAt: null,
    })
      .select("_id role")
      .lean();

    for (const user of legacyUsers) {
      const roleId = roleIdByCode.get(String(user.role).trim().toUpperCase());
      const users = roleId ? userIdsByRoleId.get(roleId) : null;

      if (users) {
        users.add(String(user._id));
      }
    }

    return roles.map((role) => {
      const userCount = userIdsByRoleId.get(String(role._id))?.size ?? 0;

      return {
        ...role,
        userCount,
        memberCount: userCount,
        totalUsers: userCount,
      };
    });
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
