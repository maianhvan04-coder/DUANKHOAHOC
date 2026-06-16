import { ROLES } from "../../../constants/roles";

function normalizeForCode(input = ""): string {
  let s = String(input).trim();

  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  s = s.replace(/[^a-zA-Z0-9]+/g, " ").trim();
  s = s.replace(/\s+/g, "_");
  s = s.toUpperCase();

  return s;
}

export function toRoleCode(input: string): string {
  const code = normalizeForCode(input);
  if (code) return code;
  return `ROLE_${Date.now()}`;
}

export function toRoleType(input: string): string {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_");
}

export function derivePriorityFromCode(code: string): number {
  const c = String(code).trim().toUpperCase();

  if (c === ROLES.ADMIN) return 100;
  if (c === ROLES.MANAGER) return 80;
  if (c === ROLES.TEACHER) return 60;
  if (c === ROLES.STUDENT) return 20;
  if (c === ROLES.USER) return 10;

  return 0;
}

export function isSystemRole(code: string): boolean {
  const c = String(code).trim().toUpperCase();
  return Object.values(ROLES).includes(c as never);
}