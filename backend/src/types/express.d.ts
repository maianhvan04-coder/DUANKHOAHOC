import "express";
import type { PermissionKey } from "../constants/permissions";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name?: string;
        email: string;
        role: string;
        roles: string[];
        permissions: PermissionKey[];
      };
    }
  }
}

export {};
