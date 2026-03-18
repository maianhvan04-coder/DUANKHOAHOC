import type { Request, Response, NextFunction } from "express";
import type { Role } from "../../constants/roles";
import type { PermissionKey } from "../../constants/permissions";

type AuthorizeOptions = {
  rolesAny?: Role[];
  permissionsAny?: PermissionKey[];
  permissionsAll?: PermissionKey[];
};

export function authorize(options: AuthorizeOptions = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập",
      });
    }

    if (options.rolesAny?.length) {
      const ok = options.rolesAny.some((role) => user.roles.includes(role));
      if (!ok) {
        return res.status(403).json({
          message: "Bạn không có vai trò phù hợp để thực hiện chức năng này",
        });
      }
    }

    if (options.permissionsAny?.length) {
      const ok = options.permissionsAny.some((permission) =>
        user.permissions.includes(permission)
      );

      if (!ok) {
        return res.status(403).json({
          message: "Bạn không có quyền thực hiện chức năng này",
        });
      }
    }

    if (options.permissionsAll?.length) {
      const ok = options.permissionsAll.every((permission) =>
        user.permissions.includes(permission)
      );

      if (!ok) {
        return res.status(403).json({
          message: "Bạn không có đủ quyền để thực hiện chức năng này",
        });
      }
    }

    return next();
  };
}