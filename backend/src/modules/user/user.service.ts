import bcrypt from "bcrypt";
import { isValidObjectId, Types } from "mongoose";
import { ROLES } from "../../constants/roles";
import { UserModel } from "./user.model";
import { getUserAccess, setRolesForUser } from "../rbac/rbac.service";
import RoleModel from "../rbac/models/role.model";
import UserRole from "../rbac/models/userRole.model";
import { StudentModel } from "../student/student.model";
import { StudentStudyModel } from "../student/student-study.model";
import { syncStudentProfileForUser } from "../student/student-profile.sync";
import { TeacherModel } from "../teacher/teacher.model";
import { syncTeacherProfileForUser } from "../teacher/teacher-profile.sync";
import { WalletModel } from "../wallet/wallet.model";
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
  role?: string;
  roles?: string[];
};

type UpdateUserInput = Partial<{
  name: string;
  email: string;
  role: string;
  roles: string[];
  password: string;
}>;

type UserUpdateData = Partial<{
  name: string;
  email: string;
  role: string;
  passwordHash: string;
}>;

const HIDDEN_USER_EMAILS = ["admin@gmail.com"];

function sanitizeUser<T extends Record<string, any>>(user: T | null) {
  if (!user) return null;
  const { passwordHash: _pw, ...safe } = user;
  return safe;
}

function normalizeRoleCodes(roleCodes: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const item of roleCodes) {
    const role = String(item || "").trim().toUpperCase();
    if (!role || seen.has(role)) continue;
    seen.add(role);
    out.push(role);
  }

  return out.length ? out : [ROLES.USER];
}

function getRequestedRoleCodes(data: { role?: string; roles?: string[] }) {
  return normalizeRoleCodes(
    data.roles?.length ? data.roles : data.role ? [data.role] : []
  );
}

async function withAccessRoles<T extends Record<string, any>>(user: T | null) {
  const safe = sanitizeUser(user);
  if (!safe?._id) return safe;

  const access = await getUserAccess(String(safe._id));

  return {
    ...safe,
    role: access.primaryRole,
    roles: access.roles,
  };
}

async function buildEffectiveRoleFilter(roleCode: string) {
  const normalizedRole = roleCode.trim().toUpperCase();
  const activeRoles = await RoleModel.find({
    isDeleted: false,
    isActive: true,
  })
    .select("_id code")
    .lean();

  const activeRoleIds = activeRoles.map((role) => role._id);
  const targetRoleIds = activeRoles
    .filter(
      (role) => String(role.code || "").trim().toUpperCase() === normalizedRole
    )
    .map((role) => role._id);

  const [usersWithEffectiveAssignments, usersAssignedToRole] =
    await Promise.all([
      UserRole.distinct("userId", {
        roleId: { $in: activeRoleIds },
        isDeleted: false,
      }),
      UserRole.distinct("userId", {
        roleId: { $in: targetRoleIds },
        isDeleted: false,
      }),
    ]);

  const legacyRoleFilter =
    normalizedRole === ROLES.USER
      ? {
          $nin: activeRoles
            .map((role) => String(role.code || "").trim().toUpperCase())
            .filter((code) => code !== ROLES.USER),
        }
      : normalizedRole;

  return {
    $or: [
      { _id: { $in: usersAssignedToRole } },
      {
        _id: { $nin: usersWithEffectiveAssignments },
        role: legacyRoleFilter,
      },
    ],
  };
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
      filter.$and = [await buildEffectiveRoleFilter(role)];
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

    const items = await Promise.all(users.map((user) => withAccessRoles(user)));
    const userIds = items
      .map((item) => item?._id)
      .filter(Boolean)
      .map((id) => new Types.ObjectId(String(id)));
    const wallets = userIds.length
      ? await WalletModel.find({ user: { $in: userIds } })
          .select("user balance")
          .lean()
      : [];
    const balanceByUserId = new Map(
      wallets.map((wallet) => [
        String(wallet.user),
        Number(wallet.balance || 0),
      ])
    );
    const itemsWithBalance = items.map((item) =>
      item?._id
        ? {
            ...item,
            balance: balanceByUserId.get(String(item._id)) || 0,
          }
        : item
    );

    return makeListResponse(itemsWithBalance, total, pagination);
  },

  async getById(id: string) {
    if (!isValidObjectId(id)) return null;

    const user = await UserModel.findById(id)
      .select("-passwordHash")
      .lean();

    return withAccessRoles(user);
  },

  async create(data: CreateUserInput) {
    const roleCodes = getRequestedRoleCodes(data);
    const role = roleCodes[0] ?? ROLES.USER;

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

    await setRolesForUser(String(doc._id), roleCodes);
    await syncStudentProfileForUser(String(doc._id));
    await syncTeacherProfileForUser(String(doc._id));

    const obj = doc.toObject() as Record<string, any>;
    return withAccessRoles(obj);
  },

  async update(id: string, data: UpdateUserInput) {
    if (!isValidObjectId(id)) return null;

    const updateData: UserUpdateData = {};

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

    const shouldUpdateRoles =
      data.roles !== undefined || data.role !== undefined;
    const roleCodes = shouldUpdateRoles ? getRequestedRoleCodes(data) : [];

    if (shouldUpdateRoles) {
      updateData.role = roleCodes[0] ?? ROLES.USER;
    }

    if (data.password !== undefined) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    const updated = await UserModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      updateData,
      { new: true }
    )
      .select("-passwordHash")
      .lean();

    if (!updated) return null;

    if (shouldUpdateRoles) {
      await setRolesForUser(id, roleCodes);
    }

    await syncStudentProfileForUser(id);
    await syncTeacherProfileForUser(id);

    return withAccessRoles(updated);
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

    if (updated) {
      await StudentModel.updateOne(
        { user: id },
        { $set: { isActive: active } }
      );
      await TeacherModel.updateOne(
        { user: id },
        { $set: { isActive: active } }
      );
    }

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

    if (updated) {
      await StudentModel.updateOne(
        { user: id },
        {
          $set: {
            isActive: false,
            isDeleted: true,
            deletedAt: updated.deletedAt,
          },
        }
      );
      await StudentStudyModel.updateMany(
        { student: id },
        { $set: { isActive: false } }
      );
      await TeacherModel.updateOne(
        { user: id },
        {
          $set: {
            isActive: false,
            isDeleted: true,
            deletedAt: updated.deletedAt,
          },
        }
      );
    }

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

    await StudentModel.deleteOne({ user: userId });
    await StudentStudyModel.deleteMany({ student: userId });
    await TeacherModel.deleteOne({ user: userId });

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

    if (updated) {
      await StudentModel.updateOne(
        { user: id },
        {
          $set: {
            isActive: true,
            isDeleted: false,
            deletedAt: null,
          },
        }
      );
      await StudentStudyModel.updateMany(
        { student: id },
        { $set: { isActive: true } }
      );
      await TeacherModel.updateOne(
        { user: id },
        {
          $set: {
            isActive: true,
            isDeleted: false,
            deletedAt: null,
          },
        }
      );
    }

    return !!updated;
  },
};
