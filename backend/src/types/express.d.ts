import "express";
import type { Role } from "../constants/roles";
import type { PermissionKey } from "../constants/permissions";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
        roles: Role[];
        permissions: PermissionKey[];
      };
    }
  }
}

export {};