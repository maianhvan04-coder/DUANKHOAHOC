// src/modules/role/role.service.ts
import httpStatus from "../../core/httpStatus";
import ApiError from "../../core/apiError";

import { roleRepo } from "./repos/role.repo";
import type { RoleCreatePayload, RoleType } from "./role.types";

// đường dẫn utils tuỳ bạn đang đặt file ở đâu.
// theo code JS bạn gửi: ../utils/role.util
import { toRoleCode, deriveTypeFromCode, derivePriorityFromType } from "./utils/role.util";

type RoleUpdatePayload = Partial<RoleCreatePayload> & { code?: string };

export async function createRole(payload: RoleCreatePayload) {
  const { name, description = "", code, type, priority, isActive } = payload as any;

  if (!name || !String(name).trim()) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Thiếu name");
  }

  const finalCode = String(code ?? "").trim()
    ? String(code).trim().toUpperCase()
    : toRoleCode(String(name));

  const finalType: RoleType = (type as RoleType) || deriveTypeFromCode(finalCode);

  const finalPriority =
    typeof priority === "number" ? priority : derivePriorityFromType(finalType);

  const exists = await roleRepo.existsByCode(finalCode);
  if (exists) throw new ApiError(httpStatus.CONFLICT, "Role code đã tồn tại");

  const role = await roleRepo.create({
    code: finalCode,
    name: String(name).trim(),
    description: String(description || "").trim(),
    type: finalType,
    priority: finalPriority,
    isActive: typeof isActive === "boolean" ? isActive : true,
  });

  return role;
}

export async function updateRole(id: string, payload: RoleUpdatePayload) {
  const { name, description, code, type, priority, isActive } = payload;

  const role = await roleRepo.findById(id);
  if (!role) throw new ApiError(httpStatus.NOT_FOUND, "Role không tồn tại");

  // đổi code → check unique
  if (code && code.trim().toUpperCase() !== role.code) {
    const newCode = code.trim().toUpperCase();

    const exists = await roleRepo.existsByCodeExceptId(newCode, id);
    if (exists) throw new ApiError(httpStatus.CONFLICT, "Role code đã tồn tại");

    role.code = newCode;

    // auto type theo code nếu client không gửi type
    if (type == null) {
      role.type = deriveTypeFromCode(newCode);
    }
  }

  if (name != null) role.name = String(name).trim();
  if (description != null) role.description = String(description).trim();
  if (type != null) role.type = type as RoleType;
  if (typeof priority === "number") role.priority = priority;
  if (typeof isActive === "boolean") role.isActive = isActive;

  await role.save();
  return role;
}

export async function deleteRole(id: string) {
  const role = await roleRepo.findById(id);
  if (!role) throw new ApiError(httpStatus.NOT_FOUND, "Role không tồn tại");

  await roleRepo.deleteById(id);
  return true;
}

export async function toggleStatus(id: string) {
  const role = await roleRepo.findById(id);
  if (!role) throw new ApiError(httpStatus.NOT_FOUND, "Role không tồn tại");

  // chặn ADMIN nếu muốn
  if (role.code === "ADMIN") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Không được tắt ADMIN");
  }

  role.isActive = !role.isActive;
  await role.save();
  return role;
}