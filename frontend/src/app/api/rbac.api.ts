import { http } from "@/lib/utils/http";

export type RoleCode =
  | "ADMIN"
  | "MANAGER"
  | "TEACHER"
  | "STUDENT"
  | "USER";

export type PermissionKey = string;

export type PermissionMetaItem = {
  key: PermissionKey;
  resource: string;
  action: string;
  label: string;
  groupKey: string;
  groupLabel: string;
  order?: number;
};

export type RoleItem = {
  _id: string;
  code: RoleCode | string;
  type: string;
  name?: string;
  description?: string;
  priority?: number;
  isSystem?: boolean;
  isActive?: boolean;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;

  // optional để FE hiển thị số user nếu backend có trả
  userCount?: number;
  memberCount?: number;
  totalUsers?: number;
};

export type PermissionItem = {
  _id: string;
  key: PermissionKey;
  resource: string;
  action: string;
  label: string;
  groupKey: string;
  groupLabel: string;
  order?: number;
  isActive?: boolean;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type UserAccess = {
  primaryRole: string;
  roles: string[];
  permissions: PermissionKey[];
};

export type RbacCatalogResponse = {
  roles: string[];
  permissions: PermissionKey[];
  permissionMeta: PermissionMetaItem[];
  defaultRolePermissions: Record<string, PermissionKey[]>;
  screens: Record<string, unknown>;
  studentScreens?: Record<string, unknown>;
  teacherScreens?: Record<string, unknown>;
};

export type RolePermissionsResponse = {
  role: RoleItem;
  permissionKeys: PermissionKey[];
  permissions: PermissionItem[];
};

export type UserAccessResponse = {
  user: {
    _id: string;
    name?: string;
    email?: string;
    role?: string;
    active?: boolean;
    deletedAt?: string | null;
  };
  access: UserAccess;
};

export type CreateRolePayload = {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
};

export type UpdateRolePayload = {
  name?: string;
  description?: string;
  isActive?: boolean;
};

export type CreateRoleResponse = {
  message?: string;
  role: RoleItem;
};

export type UpdateRoleResponse = {
  message?: string;
  role: RoleItem;
};

export type DeleteRoleResponse = {
  message?: string;
  roleCode?: string;
};

export const rbacApi = {
  // GET /api/rbac/catalog
  getCatalog: async () => {
    return (await http.get<RbacCatalogResponse>("/api/rbac/catalog")).data;
  },

  // GET /api/rbac/roles
  getRoles: async () => {
    return (await http.get<RoleItem[]>("/api/rbac/roles")).data;
  },

  // POST /api/rbac/roles
  createRole: async (body: CreateRolePayload) => {
    return (await http.post<CreateRoleResponse>("/api/rbac/roles", body)).data;
  },

  // PUT /api/rbac/roles/:roleCode
  updateRole: async (roleCode: string, body: UpdateRolePayload) => {
    return (
      await http.put<UpdateRoleResponse>(
        `/api/rbac/roles/${encodeURIComponent(roleCode)}`,
        body
      )
    ).data;
  },

  // DELETE /api/rbac/roles/:roleCode
  deleteRole: async (roleCode: string) => {
    return (
      await http.delete<DeleteRoleResponse>(
        `/api/rbac/roles/${encodeURIComponent(roleCode)}`
      )
    ).data;
  },

  // GET /api/rbac/permissions
  getPermissions: async () => {
    return (await http.get<PermissionItem[]>("/api/rbac/permissions")).data;
  },

  // GET /api/rbac/roles/:roleCode/permissions
  getRolePermissions: async (roleCode: string) => {
    return (
      await http.get<RolePermissionsResponse>(
        `/api/rbac/roles/${encodeURIComponent(roleCode)}/permissions`
      )
    ).data;
  },

  // PUT /api/rbac/roles/:roleCode/permissions
  setRolePermissions: async (roleCode: string, permissions: string[]) => {
    return (
      await http.put<{
        message: string;
        roleCode: string;
        permissionKeys: PermissionKey[];
        permissions: PermissionItem[];
      }>(`/api/rbac/roles/${encodeURIComponent(roleCode)}/permissions`, {
        permissions,
      })
    ).data;
  },

  // GET /api/rbac/users/:userId/access
  getUserAccess: async (userId: string) => {
    return (
      await http.get<UserAccessResponse>(
        `/api/rbac/users/${encodeURIComponent(userId)}/access`
      )
    ).data;
  },

  // PUT /api/rbac/users/:userId/roles
  setUserRoles: async (userId: string, roles: string[]) => {
    return (
      await http.put<{
        message: string;
        userId: string;
        access: UserAccess;
      }>(`/api/rbac/users/${encodeURIComponent(userId)}/roles`, {
        roles,
      })
    ).data;
  },

  // POST /api/rbac/seed
  seed: async () => {
    return (
      await http.post<{
        message: string;
      }>("/api/rbac/seed")
    ).data;
  },

  // POST /api/rbac/sync-admin
  syncAdmin: async () => {
    return (
      await http.post<{
        message: string;
        roleCode: string;
        permissionKeys: PermissionKey[];
      }>("/api/rbac/sync-admin")
    ).data;
  },

  // POST /api/rbac/sync-legacy-users
  syncLegacyUsers: async () => {
    return (
      await http.post<{
        message: string;
      }>("/api/rbac/sync-legacy-users")
    ).data;
  },
};
