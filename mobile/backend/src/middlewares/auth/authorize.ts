import type { Request, Response, NextFunction } from "express";
import type { Role } from "../../constants/roles";
import type { PermissionKey } from "../../constants/permissions";
import { createSecurityAuditService } from "../../modules/audit/security/security-audit.service";

type AuthorizeOptions = {
  rolesAny?: Role[];
  permissionsAny?: PermissionKey[];
  permissionsAll?: PermissionKey[];
};

export function authorize(options: AuthorizeOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          message: "Bạn chưa đăng nhập",
        });
      }

      const userId = user.id || null;
      const userEmail = user.email || "";
      const userName = "";

      if (options.rolesAny?.length) {
        const ok = options.rolesAny.some((role) => user.roles.includes(role));

        if (!ok) {
          await createSecurityAuditService({
            userId,
            userName,
            userEmail,
            action: "ACCESS_DENIED",
            method: req.method,
            path: req.originalUrl,
            ipAddress: req.ip,
            userAgent: (req.headers["user-agent"] as string) || "",
            success: false,
            statusCode: 403,
            message: "Bạn không có vai trò phù hợp để thực hiện chức năng này",
            meta: {
              rolesAny: options.rolesAny,
            },
          });

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
          await createSecurityAuditService({
            userId,
            userName,
            userEmail,
            action: "ACCESS_DENIED",
            method: req.method,
            path: req.originalUrl,
            ipAddress: req.ip,
            userAgent: (req.headers["user-agent"] as string) || "",
            success: false,
            statusCode: 403,
            message: "Bạn không có quyền thực hiện chức năng này",
            meta: {
              permissionsAny: options.permissionsAny,
            },
          });

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
          await createSecurityAuditService({
            userId,
            userName,
            userEmail,
            action: "ACCESS_DENIED",
            method: req.method,
            path: req.originalUrl,
            ipAddress: req.ip,
            userAgent: (req.headers["user-agent"] as string) || "",
            success: false,
            statusCode: 403,
            message: "Bạn không có đủ quyền để thực hiện chức năng này",
            meta: {
              permissionsAll: options.permissionsAll,
            },
          });

          return res.status(403).json({
            message: "Bạn không có đủ quyền để thực hiện chức năng này",
          });
        }
      }

      await createSecurityAuditService({
        userId,
        userName,
        userEmail,
        action: "ACCESS_GRANTED",
        method: req.method,
        path: req.originalUrl,
        ipAddress: req.ip,
        userAgent: (req.headers["user-agent"] as string) || "",
        success: true,
        statusCode: 200,
        message: "Truy cập thành công",
        meta: {
          rolesAny: options.rolesAny || [],
          permissionsAny: options.permissionsAny || [],
          permissionsAll: options.permissionsAll || [],
        },
      });

      return next();
    } catch (error) {
      return next(error);
    }
  };
}