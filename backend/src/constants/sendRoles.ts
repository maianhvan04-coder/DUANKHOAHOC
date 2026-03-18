import { ROLES } from "./roles";

type SeedRole = {
  code: string;
  type: string;
  name?: string;
  description?: string;
  priority: number;
  isSystem?: boolean;
};

export const SEED_ROLES: SeedRole[] = [
  { code: ROLES.ADMIN, type: "admin", priority: 100 },
  { code: ROLES.MANAGER, type: "manager", priority: 80 },
  { code: ROLES.TEACHER, type: "teacher", priority: 60 },
  { code: ROLES.STUDENT, type: "student", priority: 20 },
  { code: ROLES.USER, type: "user", priority: 10 },
];