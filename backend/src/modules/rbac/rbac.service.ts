import { Types } from "mongoose";
import { PERMISSIONS, type PermissionKey } from "../../constants/permissions";
import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_META_LIST,
  expandPermissionKeys,
  simplifyPermissionKeys,
} from "../../constants/rbac.catalog";
import { ROLES, type Role } from "../../constants/roles";
import { SEED_ROLES } from "../../constants/sendRoles";
import { UserModel } from "../user/user.model";
import Permission from "./models/permission.model";
import RoleModel from "./models/role.model";
import RolePermission from "./models/rolePermission.model";
import { roleRepo } from "./repos/role.repo";
import { userRoleRepo } from "./repos/userRole.repo";

export type UserAccess = {
  primaryRole: string;
  roles: string[];
  permissions: PermissionKey[];
};

function badRequest(message: string) {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = 400;
  return error;
}

function toObjectId(value: string | Types.ObjectId): Types.ObjectId {
  if (value instanceof Types.ObjectId) return value;

  if (!Types.ObjectId.isValid(value)) {
    throw badRequest("ObjectId không hợp lệ");
  }

  return new Types.ObjectId(value);
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function normalizeRoleCode(value: string) {
  return String(value).trim().toUpperCase();
}

function normalizePermissionKey(value: string) {
  return String(value).trim().toLowerCase() as PermissionKey;
}

function isRoleCode(value: string): value is Role {
  return !!normalizeRoleCode(value);
}

function normalizeAccessRole(value: unknown): string {
  const normalized = normalizeRoleCode(String(value || ""));
  return normalized || ROLES.USER;
}

function sortRolesByPriority<T extends { priority?: number | null; code: string }>(
  roles: T[]
): T[] {
  return [...roles].sort(
    (a, b) =>
      Number(b.priority ?? 0) - Number(a.priority ?? 0) ||
      String(a.code).localeCompare(String(b.code))
  );
}

async function getPermissionsByRoleIds(
  roleIds: Types.ObjectId[]
): Promise<PermissionKey[]> {
  if (!roleIds.length) return [];

  const keys = await RolePermission.distinct("permissionKey", {
    roleId: { $in: roleIds },
    isDeleted: false,
  });

  if (!keys.length) return [];

  const validPermissions = await Permission.find({
    key: { $in: keys as string[] },
    isDeleted: false,
    isActive: true,
  })
    .select("key")
    .lean();

  return unique(validPermissions.map((item) => item.key as PermissionKey));
}

async function syncPermissionCatalog() {
  for (const meta of PERMISSION_META_LIST) {
    await Permission.updateOne(
      { key: meta.key },
      {
        $set: {
          resource: meta.resource,
          action: meta.action,
          label: meta.label,
          groupKey: meta.groupKey,
          groupLabel: meta.groupLabel,
          order: meta.order ?? 0,
          isActive: true,
          isDeleted: false,
          deletedAt: null,
        },
        $setOnInsert: {
          key: meta.key,
        },
      },
      { upsert: true }
    );
  }
}

export async function setPermissionsForRoleCode(
  roleCode: string,
  permissionKeys: PermissionKey[]
): Promise<PermissionKey[]> {
  const normalizedRoleCode = normalizeRoleCode(roleCode);
  const role = await roleRepo.findByCode(normalizedRoleCode);

  if (!role) {
    throw badRequest(`Không tìm thấy vai trò ${normalizedRoleCode}`);
  }

  const requestedKeys = unique(
    permissionKeys.map((item) => normalizePermissionKey(String(item)))
  );
  const normalizedKeys = expandPermissionKeys(requestedKeys);

  await syncPermissionCatalog();

  const validPermissions = await Permission.find({
    key: { $in: normalizedKeys },
    isDeleted: false,
    isActive: true,
  })
    .select("key")
    .lean();

  const validKeys = unique(
    validPermissions.map((item) => item.key as PermissionKey)
  );

  const validKeySet = new Set(validKeys);
  const invalidKeys = normalizedKeys.filter((key) => !validKeySet.has(key));

  if (invalidKeys.length) {
    throw badRequest(
      `Permission không hợp lệ hoặc đã bị vô hiệu hóa: ${invalidKeys.join(", ")}`
    );
  }

  await RolePermission.updateMany(
    {
      roleId: role._id,
      isDeleted: false,
    },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    }
  );

  if (!validKeys.length) return [];

  await RolePermission.bulkWrite(
    validKeys.map((permissionKey) => ({
      updateOne: {
        filter: {
          roleId: role._id,
          permissionKey,
        },
        update: {
          $set: {
            isDeleted: false,
            deletedAt: null,
            scope: "all",
            field: null,
          },
          $setOnInsert: {
            roleId: role._id,
            permissionKey,
          },
        },
        upsert: true,
      },
    }))
  );

  return validKeys;
}

export async function seedDefaultRbac() {
  await syncPermissionCatalog();

  for (const item of SEED_ROLES) {
    await RoleModel.updateOne(
      { code: item.code },
      {
        $set: {
          type: item.type,
          name: item.name ?? item.code,
          description: item.description ?? "",
          priority: item.priority,
          isSystem: item.isSystem ?? true,
          isActive: true,
          isDeleted: false,
          deletedAt: null,
        },
        $setOnInsert: {
          code: item.code,
        },
      },
      { upsert: true }
    );
  }

  for (const [roleCode, permissionKeys] of Object.entries(
    DEFAULT_ROLE_PERMISSIONS
  ) as [Role, PermissionKey[]][]) {
    await setPermissionsForRoleCode(roleCode, permissionKeys);
  }
}

export async function syncAdminRolePermissions() {
  return setPermissionsForRoleCode(
    ROLES.ADMIN,
    Object.values(PERMISSIONS) as PermissionKey[]
  );
}

export async function setRolesForUser(userId: string, roleCodes: string[]) {
  const normalizedRoleCodes = unique(
    roleCodes.map((item) => normalizeRoleCode(String(item))).filter(Boolean)
  );

  const invalidRoleCodes = normalizedRoleCodes.filter(
    (code) => !isRoleCode(code)
  );

  if (invalidRoleCodes.length) {
    throw badRequest(`Vai trò không hợp lệ: ${invalidRoleCodes.join(", ")}`);
  }

  const targetRoleCodes: Role[] = normalizedRoleCodes.length
    ? (normalizedRoleCodes as Role[])
    : [ROLES.USER];

  const roles = await roleRepo.findActiveByCodes(targetRoleCodes);

  const foundRoleCodeSet = new Set(
    roles.map((role) => normalizeRoleCode(String(role.code)))
  );

  const missingRoleCodes = targetRoleCodes.filter(
    (code) => !foundRoleCodeSet.has(code)
  );

  if (missingRoleCodes.length) {
    throw badRequest(
      `Vai trò chưa được seed hoặc đang bị vô hiệu hóa: ${missingRoleCodes.join(", ")}`
    );
  }

  const sortedRoles = sortRolesByPriority(roles);
  const primaryRole = normalizeAccessRole(sortedRoles[0]?.code);

  await userRoleRepo.replaceRolesForUser(
    userId,
    sortedRoles.map((role) => role._id as Types.ObjectId)
  );

  await UserModel.updateOne(
    { _id: toObjectId(userId) },
    {
      $set: {
        role: primaryRole,
      },
    }
  );
}

export async function getUserAccess(userId: string): Promise<UserAccess> {
  const roleIds = await userRoleRepo.findActiveRoleIdsByUserId(userId);

  if (roleIds.length) {
    const roles = await roleRepo.findActiveByIds(roleIds);
    const sortedRoles = sortRolesByPriority(roles);
    const roleCodes = unique(
      sortedRoles.map((role) => normalizeAccessRole(role.code))
    );

    if (roleCodes.length) {
      const permissions = await getPermissionsByRoleIds(
        sortedRoles.map((role) => role._id as Types.ObjectId)
      );
      const accessPermissions = unique([
        ...permissions,
        ...simplifyPermissionKeys(permissions),
      ]);

      return {
        primaryRole: roleCodes[0] ?? ROLES.USER,
        roles: roleCodes,
        permissions: accessPermissions,
      };
    }
  }

  const user = await UserModel.findById(toObjectId(userId))
    .select("role")
    .lean();

  const legacyRole = normalizeAccessRole(user?.role);

  const roleDoc = await roleRepo.findActiveByCode(legacyRole);

  if (roleDoc) {
    const permissions = await getPermissionsByRoleIds([
      roleDoc._id as Types.ObjectId,
    ]);
    const accessPermissions = unique([
      ...permissions,
      ...simplifyPermissionKeys(permissions),
    ]);

    return {
      primaryRole: legacyRole,
      roles: [legacyRole],
      permissions: accessPermissions,
    };
  }

  return {
    primaryRole: ROLES.USER,
    roles: [ROLES.USER],
    permissions: [],
  };
}

export async function syncLegacyUserRolesFromUsers() {
  const users = await UserModel.find({}).select("_id role").lean();

  for (const user of users) {
    const roleCode = normalizeAccessRole(user.role);
    await setRolesForUser(String(user._id), [roleCode]);
  }
}
