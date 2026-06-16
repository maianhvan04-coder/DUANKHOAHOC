import { ROLES } from "../../../constants/roles";
import { roleRepo } from "../repos/role.repo";
import {
  derivePriorityFromCode,
  isSystemRole,
  toRoleCode,
  toRoleType,
} from "../utils/role.util";

type RoleCreatePayload = {
  code?: string;
  type?: string;
  name?: string;
  description?: string;
  priority?: number;
  isSystem?: boolean;
  isActive?: boolean;
};

type RoleUpdatePayload = Partial<RoleCreatePayload>;

export const roleService = {
  async list() {
    return roleRepo.findAll();
  },

  async listActive() {
    const roles = await roleRepo.findAll();
    return roles.filter((role) => role.isActive);
  },

  async getById(id: string) {
    return roleRepo.findById(id);
  },

  async create(payload: RoleCreatePayload) {
    const rawCode = String(payload.code || "").trim();
    const rawName = String(payload.name || "").trim();

    const code = rawCode
      ? rawCode.toUpperCase()
      : toRoleCode(rawName || payload.type || "ROLE");

    if (!code) {
      throw new Error("Mã vai trò không được để trống");
    }

    const exists = await roleRepo.existsByCode(code);
    if (exists) {
      throw new Error("Mã vai trò đã tồn tại");
    }

    const type = String(payload.type || "").trim()
      ? toRoleType(String(payload.type))
      : toRoleType(code);

    const priority =
      typeof payload.priority === "number"
        ? payload.priority
        : derivePriorityFromCode(code);

    return roleRepo.create({
      code,
      type,
      name: rawName || code,
      description: String(payload.description || "").trim(),
      priority,
      isSystem: typeof payload.isSystem === "boolean" ? payload.isSystem : false,
      isActive: typeof payload.isActive === "boolean" ? payload.isActive : true,
    });
  },

  async update(id: string, payload: RoleUpdatePayload) {
    const role = await roleRepo.findById(id);

    if (!role) {
      throw new Error("Không tìm thấy vai trò");
    }

    const updateData: RoleUpdatePayload = {};

    if (payload.code != null) {
      const newCode = String(payload.code).trim().toUpperCase();

      if (!newCode) {
        throw new Error("Mã vai trò không được để trống");
      }

      if ((role.isSystem || isSystemRole(role.code)) && newCode !== role.code) {
        throw new Error("Không được đổi mã vai trò hệ thống");
      }

      if (newCode !== role.code) {
        const exists = await roleRepo.existsByCode(newCode);
        if (exists) {
          throw new Error("Mã vai trò đã tồn tại");
        }

        updateData.code = newCode;

        if (payload.priority == null) {
          updateData.priority = derivePriorityFromCode(newCode);
        }

        if (payload.type == null) {
          updateData.type = toRoleType(newCode);
        }
      }
    }

    if (payload.type != null) {
      const nextType = toRoleType(String(payload.type));

      if (!nextType) {
        throw new Error("Loại vai trò không được để trống");
      }

      updateData.type = nextType;
    }

    if (payload.name != null) {
      updateData.name = String(payload.name).trim();
    }

    if (payload.description != null) {
      updateData.description = String(payload.description).trim();
    }

    if (typeof payload.priority === "number") {
      updateData.priority = payload.priority;
    }

    if (typeof payload.isSystem === "boolean") {
      if (role.code === ROLES.ADMIN && payload.isSystem === false) {
        updateData.isSystem = false;
      } else {
        updateData.isSystem = payload.isSystem;
      }
    }

    if (typeof payload.isActive === "boolean") {
      if (role.code === ROLES.ADMIN && payload.isActive === false) {
        throw new Error("Không được tắt vai trò ADMIN");
      }

      updateData.isActive = payload.isActive;
    }

    const updated = await roleRepo.updateById(id, updateData);

    if (!updated) {
      throw new Error("Cập nhật vai trò thất bại");
    }

    return updated;
  },

  async delete(id: string) {
    const role = await roleRepo.findById(id);

    if (!role) {
      throw new Error("Không tìm thấy vai trò");
    }

    if (role.isSystem || isSystemRole(role.code)) {
      throw new Error("Không được xoá vai trò hệ thống");
    }

    await roleRepo.softDeleteById(id);
    return true;
  },

  async toggleStatus(id: string) {
    const role = await roleRepo.findById(id);

    if (!role) {
      throw new Error("Không tìm thấy vai trò");
    }

    if (role.code === ROLES.ADMIN) {
      throw new Error("Không được tắt vai trò ADMIN");
    }

    const updated = await roleRepo.updateById(id, {
      isActive: !role.isActive,
    });

    if (!updated) {
      throw new Error("Cập nhật trạng thái thất bại");
    }

    return updated;
  },
};