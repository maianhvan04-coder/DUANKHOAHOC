import { Router } from "express";
import { authGuard } from "../../middlewares/auth/authGuard";
import { authorize } from "../../middlewares/auth/authorize";
import { PERMISSIONS } from "../../constants/permissions";
import { rbacController } from "./rbac.controller";

export const rbacRouter = Router();

/**
 * Bootstrap data cho admin shell
 * Chỉ cần đăng nhập là lấy được catalog
 * => để manager/teacher vẫn vào được /admin
 */
rbacRouter.get("/catalog", authGuard, rbacController.getCatalog);

/**
 * Read roles
 */
rbacRouter.get(
  "/roles",
  authGuard,
  authorize({
    permissionsAny: [PERMISSIONS.RBAC_READ, PERMISSIONS.RBAC_MANAGE],
  }),
  rbacController.listRoles
);

/**
 * Read permissions
 */
rbacRouter.get(
  "/permissions",
  authGuard,
  authorize({
    permissionsAny: [
      PERMISSIONS.RBAC_READ_PERMISSION,
      PERMISSIONS.RBAC_MANAGE,
    ],
  }),
  rbacController.listPermissions
);

/**
 * Read permissions by role
 */
rbacRouter.get(
  "/roles/:roleCode/permissions",
  authGuard,
  authorize({
    permissionsAny: [
      PERMISSIONS.RBAC_READ_PERMISSION,
      PERMISSIONS.RBAC_MANAGE,
    ],
  }),
  rbacController.getRolePermissions
);

/**
 * Set permissions for role
 */
rbacRouter.put(
  "/roles/:roleCode/permissions",
  authGuard,
  authorize({
    permissionsAny: [
      PERMISSIONS.RBAC_SET_ROLE_PERMISSIONS,
      PERMISSIONS.RBAC_MANAGE,
    ],
  }),
  rbacController.setRolePermissions
);

/**
 * Read user access
 */
rbacRouter.get(
  "/users/:userId/access",
  authGuard,
  authorize({
    permissionsAny: [
      PERMISSIONS.RBAC_READ,
      PERMISSIONS.RBAC_SET_USER_ROLES,
      PERMISSIONS.RBAC_MANAGE,
    ],
  }),
  rbacController.getUserAccess
);

/**
 * Set roles for user
 */
rbacRouter.put(
  "/users/:userId/roles",
  authGuard,
  authorize({
    permissionsAny: [
      PERMISSIONS.RBAC_SET_USER_ROLES,
      PERMISSIONS.RBAC_MANAGE,
    ],
  }),
  rbacController.setUserRoles
);

// /**
//  * Create role
//  */
// rbacRouter.post(
//   "/roles",
//   authGuard,
//   authorize({
//     permissionsAny: [
//       PERMISSIONS.RBAC_CREATE_ROLE,
//       PERMISSIONS.RBAC_MANAGE,
//     ],
//   }),
//   rbacController.createRole
// );

// /**
//  * Update role
//  */
// rbacRouter.put(
//   "/roles/:roleCode",
//   authGuard,
//   authorize({
//     permissionsAny: [
//       PERMISSIONS.RBAC_UPDATE_ROLE,
//       PERMISSIONS.RBAC_MANAGE,
//     ],
//   }),
//   rbacController.updateRole
// );

// /**
//  * Delete role
//  */
// rbacRouter.delete(
//   "/roles/:roleCode",
//   authGuard,
//   authorize({
//     permissionsAny: [
//       PERMISSIONS.RBAC_DELETE_ROLE,
//       PERMISSIONS.RBAC_MANAGE,
//     ],
//   }),
//   rbacController.deleteRole
// );

/**
 * Seed RBAC
 */
rbacRouter.post(
  "/seed",
  authGuard,
  authorize({
    permissionsAny: [PERMISSIONS.RBAC_MANAGE],
  }),
  rbacController.seed
);

/**
 * Sync admin permissions
 */
rbacRouter.post(
  "/sync-admin",
  authGuard,
  authorize({
    permissionsAny: [PERMISSIONS.RBAC_SYNC_ADMIN, PERMISSIONS.RBAC_MANAGE],
  }),
  rbacController.syncAdmin
);

/**
 * Sync legacy users
 */
rbacRouter.post(
  "/sync-legacy-users",
  authGuard,
  authorize({
    permissionsAny: [PERMISSIONS.RBAC_MANAGE],
  }),
  rbacController.syncLegacyUsers
);