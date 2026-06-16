import type { Request, Response, NextFunction } from "express";
import type { Role } from "../constants/roles";

export const requireRole = (role: Role) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ message: "Unauthenticated" });
  if (req.user.role !== role) return res.status(403).json({ message: "Forbidden" });
  next();
};
