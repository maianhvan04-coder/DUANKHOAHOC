import { Types } from "mongoose";
import RoleModel from "../models/role.model";

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

function badRequest(message: string) {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = 400;
  return error;
}

function toObjectId(value: string | Types.ObjectId): Types.ObjectId {
  if (value instanceof Types.ObjectId) return value;

  if (!Types.ObjectId.isValid(value)) {
    throw badRequest("ObjectId không hợp lệ");
  }

  return new Types.ObjectId(value);
}

function normalizeRoleCode(code: string) {
  return String(code).trim().toUpperCase();
}

function normalizeRoleType(type: string) {
  return String(type).trim().toLowerCase();
}

export const roleRepo = {
  findById(id: string | Types.ObjectId) {
    return RoleModel.findOne({
      _id: toObjectId(id),
      isDeleted: false,
    }).lean();
  },

  findByCode(code: string) {
    return RoleModel.findOne({
      code: normalizeRoleCode(code),
      isDeleted: false,
    }).lean();
  },

  findActiveByCode(code: string) {
    return RoleModel.findOne({
      code: normalizeRoleCode(code),
      isDeleted: false,
      isActive: true,
    }).lean();
  },

  findActiveByCodes(codes: string[]) {
    const normalizedCodes = [...new Set(codes.map(normalizeRoleCode))];

    return RoleModel.find({
      code: { $in: normalizedCodes },
      isDeleted: false,
      isActive: true,
    })
      .sort({ priority: -1, code: 1 })
      .lean();
  },

  findActiveByIds(roleIds: Array<string | Types.ObjectId>) {
    const normalizedIds = roleIds.map((id) => toObjectId(id));

    return RoleModel.find({
      _id: { $in: normalizedIds },
      isDeleted: false,
      isActive: true,
    })
      .sort({ priority: -1, code: 1 })
      .lean();
  },

  findAll() {
    return RoleModel.find({
      isDeleted: false,
    })
      .sort({ priority: -1, code: 1 })
      .lean();
  },

  async existsByCode(code: string) {
    const doc = await RoleModel.findOne({
      code: normalizeRoleCode(code),
      isDeleted: false,
    })
      .select("_id")
      .lean();

    return !!doc;
  },

  create(payload: RoleCreatePayload) {
    return RoleModel.create({
      code: normalizeRoleCode(String(payload.code || "")),
      type: normalizeRoleType(String(payload.type || "")),
      name: String(payload.name || payload.code || "").trim(),
      description: String(payload.description || "").trim(),
      priority: Number(payload.priority ?? 0),
      isSystem: Boolean(payload.isSystem ?? false),
      isActive: Boolean(payload.isActive ?? true),
      isDeleted: false,
      deletedAt: null,
    });
  },

  updateById(id: string | Types.ObjectId, payload: RoleUpdatePayload) {
    const updateData: Record<string, unknown> = {};

    if (payload.code !== undefined) {
      updateData.code = normalizeRoleCode(payload.code);
    }

    if (payload.type !== undefined) {
      updateData.type = normalizeRoleType(payload.type);
    }

    if (payload.name !== undefined) {
      updateData.name = String(payload.name).trim();
    }

    if (payload.description !== undefined) {
      updateData.description = String(payload.description).trim();
    }

    if (payload.priority !== undefined) {
      updateData.priority = Number(payload.priority);
    }

    if (payload.isSystem !== undefined) {
      updateData.isSystem = Boolean(payload.isSystem);
    }

    if (payload.isActive !== undefined) {
      updateData.isActive = Boolean(payload.isActive);
    }

    return RoleModel.findOneAndUpdate(
      {
        _id: toObjectId(id),
        isDeleted: false,
      },
      {
        $set: updateData,
      },
      {
        new: true,
      }
    ).lean();
  },

  softDeleteById(id: string | Types.ObjectId) {
    return RoleModel.findOneAndUpdate(
      {
        _id: toObjectId(id),
        isDeleted: false,
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          isActive: false,
        },
      },
      { new: true }
    ).lean();
  },

  restoreById(id: string | Types.ObjectId) {
    return RoleModel.findOneAndUpdate(
      {
        _id: toObjectId(id),
        isDeleted: true,
      },
      {
        $set: {
          isDeleted: false,
          deletedAt: null,
          isActive: true,
        },
      },
      { new: true }
    ).lean();
  },
};