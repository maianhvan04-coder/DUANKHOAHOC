import type { Request, Response } from "express";
import { Types } from "mongoose";

import { asyncHandler } from "../../utils/asyncHandler";
import type { PermissionKey } from "../../constants/permissions";
import {
  ADMIN_SCREENS,
  SIMPLIFIED_DEFAULT_ROLE_PERMISSIONS,
  SIMPLIFIED_PERMISSION_META_LIST,
  expandPermissionKeys,
  simplifyPermissionKeys,
} from "../../constants/rbac.catalog";
import { ROLES } from "../../constants/roles";

import { rbacRepo } from "./rbac.repo";
import { roleRepo } from "./repos/role.repo";
import { roleService } from "./services/role.service";
import {
  getUserAccess as getUserAccessService,
  seedDefaultRbac,
  setPermissionsForRoleCode,
  setRolesForUser,
  syncAdminRolePermissions,
  syncLegacyUserRolesFromUsers,
} from "./rbac.service";
import {
  createRoleSchema,
  roleCodeParamsSchema,
  setRolePermissionsSchema,
  setUserRolesSchema,
  updateRoleSchema,
  userIdParamsSchema,
} from "./rbac.validate";

function normalizePermissionKeys(values: string[]): PermissionKey[] {
  return [
    ...new Set(values.map((item) => String(item).trim().toLowerCase())),
  ] as PermissionKey[];
}

export const rbacController = {
  getCatalog: asyncHandler(async (_req: Request, res: Response) => {
    res.json({
      roles: Object.values(ROLES),
      permissions: SIMPLIFIED_PERMISSION_META_LIST.map((item) => item.key),
      permissionMeta: SIMPLIFIED_PERMISSION_META_LIST,
      defaultRolePermissions: SIMPLIFIED_DEFAULT_ROLE_PERMISSIONS,
      screens: ADMIN_SCREENS,
    });
  }),

  listRoles: asyncHandler(async (_req: Request, res: Response) => {
    const roles = await rbacRepo.listRoles();
    res.json(roles);
  }),

  createRole: asyncHandler(async (req: Request, res: Response) => {
    const body = createRoleSchema.parse(req.body);
    const role = await roleService.create(body);

    res.status(201).json({
      message: "Tạo vai trò thành công",
      role,
    });
  }),

  updateRole: asyncHandler(async (req: Request, res: Response) => {
    const { roleCode } = roleCodeParamsSchema.parse(req.params);
    const body = updateRoleSchema.parse(req.body);
    const role = await roleRepo.findByCode(roleCode);

    if (!role) {
      return res.status(404).json({
        message: "Không tìm thấy vai trò",
      });
    }

    const updated = await roleService.update(String(role._id), body);

    res.json({
      message: "Cập nhật vai trò thành công",
      role: updated,
    });
  }),

  deleteRole: asyncHandler(async (req: Request, res: Response) => {
    const { roleCode } = roleCodeParamsSchema.parse(req.params);
    const role = await roleRepo.findByCode(roleCode);

    if (!role) {
      return res.status(404).json({
        message: "Không tìm thấy vai trò",
      });
    }

    await roleService.delete(String(role._id));

    res.json({
      message: "Xóa vai trò thành công",
      roleCode: String(role.code).trim().toUpperCase(),
    });
  }),

  listPermissions: asyncHandler(async (_req: Request, res: Response) => {
    const permissions = await rbacRepo.listPermissions();
    res.json(permissions);
  }),

  getRolePermissions: asyncHandler(async (req: Request, res: Response) => {
    const { roleCode } = roleCodeParamsSchema.parse(req.params);

    const role = await rbacRepo.findRoleByCode(roleCode);

    if (!role) {
      return res.status(404).json({
        message: "Không tìm thấy vai trò",
      });
    }

    const permissionKeys = simplifyPermissionKeys(
      (await rbacRepo.getRolePermissionKeys(role._id)) as PermissionKey[]
    );
    const permissions = await rbacRepo.findPermissionsByKeys(permissionKeys);

    res.json({
      role,
      permissionKeys,
      permissions,
    });
  }),

  setRolePermissions: asyncHandler(async (req: Request, res: Response) => {
    const { roleCode } = roleCodeParamsSchema.parse(req.params);
    const body = setRolePermissionsSchema.parse(req.body);

    const role = await rbacRepo.findRoleByCode(roleCode);

    if (!role) {
      return res.status(404).json({
        message: "Không tìm thấy vai trò",
      });
    }

    const normalizedKeys = normalizePermissionKeys(body.permissions);
    const expandedKeys = expandPermissionKeys(normalizedKeys);
    const savedKeys = await setPermissionsForRoleCode(roleCode, expandedKeys);
    const simplifiedKeys = simplifyPermissionKeys(savedKeys);
    const permissions = await rbacRepo.findPermissionsByKeys(simplifiedKeys);

    res.json({
      message: "Cập nhật quyền cho vai trò thành công",
      roleCode: String(role.code).trim().toUpperCase(),
      permissionKeys: simplifiedKeys,
      permissions,
    });
  }),

  getUserAccess: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = userIdParamsSchema.parse(req.params);

    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "userId không hợp lệ",
      });
    }

    const user = await rbacRepo.findUserBasicById(userId);

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng",
      });
    }

    const access = await getUserAccessService(userId);

    res.json({
      user,
      access,
    });
  }),

  setUserRoles: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = userIdParamsSchema.parse(req.params);
    const body = setUserRolesSchema.parse(req.body);

    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "userId không hợp lệ",
      });
    }

    const user = await rbacRepo.findUserBasicById(userId);

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng",
      });
    }

    await setRolesForUser(userId, body.roles);
    const access = await getUserAccessService(userId);

    res.json({
      message: "Cập nhật vai trò cho người dùng thành công",
      userId,
      user,
      access,
    });
  }),

  seed: asyncHandler(async (_req: Request, res: Response) => {
    await seedDefaultRbac();

    res.json({
      message: "Seed RBAC thành công",
    });
  }),

  syncAdmin: asyncHandler(async (_req: Request, res: Response) => {
    const permissionKeys = await syncAdminRolePermissions();

    res.json({
      message: "Đồng bộ quyền ADMIN thành công",
      roleCode: ROLES.ADMIN,
      permissionKeys,
    });
  }),

  syncLegacyUsers: asyncHandler(async (_req: Request, res: Response) => {
    await syncLegacyUserRolesFromUsers();

    res.json({
      message: "Đồng bộ role cũ từ users sang user_roles thành công",
    });
  }),
};
