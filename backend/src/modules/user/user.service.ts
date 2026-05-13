import { isValidObjectId, Types } from "mongoose";
import { ROLES, type RoleCode } from "../../constants/roles";
import { UserModel } from "./user.model";
import { setRolesForUser } from "../rbac/rbac.service";
import UserRole from "../rbac/models/userRole.model";
import {
  escapeRegex,
  getQueryString,
  makeListResponse,
  normalizeSortOrder,
  parsePagination,
  type ListQueryInput,
} from "../../utils/list-query";

type CreateUserInput = {
  name: string;
  email: string;
  role?: RoleCode;
};

type UpdateUserInput = Partial<{
  name: string;
  email: string;
  role: RoleCode;
}>;

const HIDDEN_USER_EMAILS = ["admin@gmail.com"];

function sanitizeUser<T extends Record<string, any>>(user: T | null) {
  if (!user) return null;
  const { passwordHash: _pw, ...safe } = user;
  return safe;
}

export const userService = {
  async list(deleted: boolean, query: ListQueryInput = {}) {
    const filter: Record<string, unknown> = deleted
      ? { deletedAt: { $ne: null } }
      : { deletedAt: null };

    filter.email = { $nin: HIDDEN_USER_EMAILS };

    const keyword = getQueryString(query, ["q", "search", "keyword"]);
    if (keyword) {
      const regex = new RegExp(escapeRegex(keyword), "i");
      filter.$or = [{ name: regex }, { email: regex }, { role: regex }];
    }

    const role = getQueryString(query, ["role"]);
    if (role && role.toUpperCase() !== "ALL") {
      filter.role = role.toUpperCase();
    }

    const status = getQueryString(query, ["status"]).toUpperCase();
    if (status === "ACTIVE") filter.active = true;
    if (status === "INACTIVE") filter.active = false;

    const sortBy = getQueryString(query, ["sortBy", "sort"]);
    const sortOrder = normalizeSortOrder(query.sortOrder ?? query.order);
    const sortFieldMap: Record<string, string> = {
      name: "name",
      email: "email",
      role: "role",
      status: "active",
      active: "active",
      createdAt: "createdAt",
      deletedAt: "deletedAt",
    };

    const fallbackSort = deleted ? "deletedAt" : "createdAt";
    const sortField = sortFieldMap[sortBy] || fallbackSort;
    const pagination = parsePagination(query);

    let userQuery = UserModel.find(filter)
      .sort({ [sortField]: sortOrder, _id: sortOrder })
      .select("-passwordHash")
      .lean();

    if (pagination.enabled) {
      userQuery = userQuery.skip(pagination.skip).limit(pagination.limit);
    }

    const [total, users] = await Promise.all([
      UserModel.countDocuments(filter),
      userQuery,
    ]);

    return makeListResponse(users, total, pagination);
  },

  async getById(id: string) {
    if (!isValidObjectId(id)) return null;

    const user = await UserModel.findById(id)
      .select("-passwordHash")
      .lean();

    return user;
  },

  async create(data: CreateUserInput) {
    const role = data.role ?? ROLES.USER;

    const exists = await UserModel.findOne({
      email: data.email.trim().toLowerCase(),
      deletedAt: null,
    })
      .select("_id")
      .lean();

    if (exists) {
      throw new Error("Email đã tồn tại");
    }

    const doc = await UserModel.create({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      role,
      active: true,
      deletedAt: null,
    });

    await setRolesForUser(String(doc._id), [role]);

    const obj = doc.toObject() as Record<string, any>;
    return sanitizeUser(obj);
  },

  async update(id: string, data: UpdateUserInput) {
    if (!isValidObjectId(id)) return null;

    const updateData: UpdateUserInput = {};

    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }

    if (data.email !== undefined) {
      const normalizedEmail = data.email.trim().toLowerCase();

      const exists = await UserModel.findOne({
        email: normalizedEmail,
        deletedAt: null,
        _id: { $ne: new Types.ObjectId(id) },
      })
        .select("_id")
        .lean();

      if (exists) {
        throw new Error("Email đã tồn tại");
      }

      updateData.email = normalizedEmail;
    }

    if (data.role !== undefined) {
      updateData.role = data.role;
    }

    const updated = await UserModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      updateData,
      { new: true }
    )
      .select("-passwordHash")
      .lean();

    if (!updated) return null;

    if (data.role) {
      await setRolesForUser(id, [data.role]);
    }

    return updated;
  },

  async setActive(id: string, active: boolean) {
    if (!isValidObjectId(id)) return null;

    const updated = await UserModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { active },
      { new: true }
    )
      .select("-passwordHash")
      .lean();

    return updated;
  },

  async softRemove(id: string) {
    if (!isValidObjectId(id)) return false;

    const updated = await UserModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      {
        deletedAt: new Date(),
        active: false,
      },
      { new: true }
    ).lean();

    return !!updated;
  },

  async hardRemove(id: string) {
    if (!isValidObjectId(id)) return false;

    const userId = new Types.ObjectId(id);

    const deleted = await UserModel.findOneAndDelete({
      _id: userId,
      deletedAt: { $ne: null },
    }).lean();

    if (!deleted) return false;

    await UserRole.updateMany(
      {
        userId,
        isDeleted: false,
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      }
    );

    return true;
  },

  async restore(id: string) {
    if (!isValidObjectId(id)) return false;

    const updated = await UserModel.findOneAndUpdate(
      { _id: id, deletedAt: { $ne: null } },
      {
        deletedAt: null,
        active: true,
      },
      { new: true }
    ).lean();

    return !!updated;
  },
};
