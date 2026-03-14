// src/modules/role/utils/role.util.ts
import type { RoleType } from "../role.types";

/**
 * Chuẩn hoá chuỗi để tạo code: bỏ dấu, upper, thay space bằng _
 */
function normalizeForCode(input = ""): string {
  let s = String(input).trim();

  // bỏ dấu tiếng Việt
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // giữ chữ/số, thay các ký tự khác thành khoảng trắng
  s = s.replace(/[^a-zA-Z0-9]+/g, " ").trim();

  // space => _
  s = s.replace(/\s+/g, "_");

  // upper
  s = s.toUpperCase();

  return s;
}

/**
 * Tạo roleCode từ name (VD: "Quản trị hệ thống" => "QUAN_TRI_HE_THONG")
 * Nếu rỗng thì fallback "ROLE_<timestamp>"
 */
export function toRoleCode(name: string): string {
  const code = normalizeForCode(name);
  if (code) return code;
  return `ROLE_${Date.now()}`;
}

/**
 * Derive type từ code theo enum RoleType của bạn:
 * ["admin","manager","staff","user","guest"]
 *
 * Quy tắc gợi ý:
 * - ADMIN/SUPER/ROOT => admin
 * - MANAGER => manager
 * - STAFF/EMPLOYEE => staff
 * - GUEST => guest
 * - còn lại => user
 */
export function deriveTypeFromCode(code = ""): RoleType {
  const c = String(code).trim().toUpperCase();

  if (/(SUPER|ADMIN|ROOT)/.test(c)) return "admin";
  if (/MANAGER/.test(c)) return "manager";
  if (/(STAFF|EMPLOYEE)/.test(c)) return "staff";
  if (/GUEST/.test(c)) return "guest";

  return "user";
}

/**
 * Derive priority từ type (cao hơn = quyền mạnh hơn)
 */
export function derivePriorityFromType(type: RoleType = "user"): number {
  const map: Record<RoleType, number> = {
    admin: 100,
    manager: 80,
    staff: 50,
    user: 10,
    guest: 1,
  };

  return map[type] ?? 10;
}