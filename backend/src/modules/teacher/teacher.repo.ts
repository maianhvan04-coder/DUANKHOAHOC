import { ClientSession, isValidObjectId, Types } from "mongoose";
import { TeacherModel } from "./teacher.model";
import { UserModel } from "../user/user.model";
import { ProductModel } from "../course/course.model";
import { ROLES } from "../../constants/roles";
import type {
  CreateTeacherInput,
  TeacherListItem,
  TeacherProductItem,
  UpdateTeacherInput,
} from "./teacher.types";
import {
  compareListValues,
  getQueryString,
  makeListResponse,
  normalizeSortOrder,
  paginateArray,
  parsePagination,
  type ListQueryInput,
} from "../../utils/list-query";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeName(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function buildLegacyBio(payload: {
  degree?: string;
  experience?: string;
  bio?: string;
}) {
  if (payload.bio && payload.bio.trim()) return payload.bio.trim();

  const lines: string[] = [];

  if (payload.degree?.trim()) {
    lines.push(payload.degree.trim());
  }

  const expLines = String(payload.experience || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  lines.push(...expLines);

  return lines.map((line) => `- ${line}`).join("\n");
}

function getUserIdFromTeacherDoc(teacher: any) {
  if (!teacher?.user) return "";
  if (typeof teacher.user === "object" && teacher.user?._id) {
    return String(teacher.user._id);
  }
  return String(teacher.user);
}

async function mapTeachers(items: any[]): Promise<TeacherListItem[]> {
  if (!items.length) return [];

  const teacherIds = items.map((item) => item._id).filter(Boolean);

  const teacherNameToId = new Map<string, string>();
  const teacherNames: string[] = [];

  for (const item of items) {
    const rawName = String(item?.user?.name || "").trim();
    const teacherId = String(item?._id || "").trim();

    if (!rawName || !teacherId) continue;

    const normalized = normalizeName(rawName);
    if (!normalized) continue;

    teacherNameToId.set(normalized, teacherId);
    teacherNames.push(rawName);
  }

  const products = await ProductModel.find({
    isDeleted: false,
    $or: [
      { teacher: { $in: teacherIds } },
      { teacherName: { $in: teacherNames } },
    ],
  })
    .select(
      "title slug status studentCount image price originalPrice teacher teacherName"
    )
    .sort({ createdAt: -1 })
    .lean();

  const productMap = new Map<string, TeacherProductItem[]>();
  const productSeenMap = new Map<string, Set<string>>();

  function pushProduct(teacherId: string, product: TeacherProductItem) {
    if (!teacherId) return;

    if (!productMap.has(teacherId)) {
      productMap.set(teacherId, []);
    }

    if (!productSeenMap.has(teacherId)) {
      productSeenMap.set(teacherId, new Set<string>());
    }

    const seen = productSeenMap.get(teacherId)!;
    if (seen.has(product._id)) return;

    seen.add(product._id);
    productMap.get(teacherId)!.push(product);
  }

  for (const product of products) {
    const productRecord = product as any;
    const productItem: TeacherProductItem = {
      _id: String(product._id),
      title: String(product.title || ""),
      slug: String(product.slug || ""),
      status: String(product.status || ""),
      studentCount: Number(productRecord.studentCount || 0),
      image: String(product.image || ""),
      price: Number(product.price || 0),
      originalPrice: Number(productRecord.originalPrice || 0),
    };

    const teacherIdFromRef =
      product.teacher instanceof Types.ObjectId
        ? String(product.teacher)
        : String(product.teacher || "");

    if (teacherIdFromRef && teacherIds.includes(teacherIdFromRef)) {
      pushProduct(teacherIdFromRef, productItem);
      continue;
    }

    const teacherNameKey = normalizeName(String((product as any).teacherName || ""));
    const teacherIdFromName = teacherNameToId.get(teacherNameKey) || "";

    if (teacherIdFromName) {
      pushProduct(teacherIdFromName, productItem);
    }
  }

  return items
    .filter((item) => item.user)
    .map((item) => {
      const user = item.user as any;
      const teacherId = String(item._id);
      const teacherProducts = productMap.get(teacherId) || [];
      const totalStudents = teacherProducts.reduce(
        (sum, product) => sum + Number(product.studentCount || 0),
        0
      );

      return {
        _id: teacherId,
        userId: String(user._id || ""),
        name: String(user.name || ""),
        email: String(user.email || ""),
        specialty: String(item.specialty || ""),
        phone: String(item.phone || ""),
        avatar: String(item.avatar || ""),

        degree: String(item.degree || ""),
        experience: String(item.experience || ""),
        achievement: String(item.achievement || ""),
        bio: String(item.bio || ""),

        rating: Number(item.rating || 4.8),
        active: item.isActive !== false && user.active !== false,
        deletedAt: item.deletedAt ? new Date(item.deletedAt).toISOString() : null,
        productCount: teacherProducts.length,
        totalStudents,
        products: teacherProducts,
        createdAt: item.createdAt
          ? new Date(item.createdAt).toISOString()
          : undefined,
        updatedAt: item.updatedAt
          ? new Date(item.updatedAt).toISOString()
          : undefined,
      };
    });
}

export const teacherRepo = {
  async list(query: ListQueryInput & { deleted?: boolean } = {}) {
    const keyword = String(query?.q || "").trim();
    const deleted = Boolean(query?.deleted);

    const teacherFilter: Record<string, unknown> = {
      isDeleted: deleted,
    };

    if (keyword) {
      const regex = new RegExp(escapeRegex(keyword), "i");

      const matchedUsers = await UserModel.find({
        deletedAt: deleted ? { $ne: null } : null,
        role: ROLES.TEACHER,
        $or: [{ name: regex }, { email: regex }],
      })
        .select("_id")
        .lean();

      const matchedUserIds = matchedUsers.map((item) => item._id);

      Object.assign(teacherFilter, {
        $or: [
          { specialty: regex },
          { phone: regex },
          { degree: regex },
          { experience: regex },
          { achievement: regex },
          { bio: regex },
          { user: { $in: matchedUserIds } },
        ],
      });
    }

    const teachers = await TeacherModel.find(teacherFilter)
      .populate({
        path: "user",
        select: "name email role active deletedAt",
      })
      .sort({ createdAt: -1 })
      .lean();

    let items = await mapTeachers(teachers as any[]);

    const specialty = getQueryString(query, ["specialty"]);
    if (specialty && specialty.toLowerCase() !== "all") {
      items = items.filter((item) => item.specialty === specialty);
    }

    const status = getQueryString(query, ["status"]).toLowerCase();
    if (status === "active") {
      items = items.filter((item) => item.active);
    }
    if (status === "inactive") {
      items = items.filter((item) => !item.active);
    }

    const sortBy = getQueryString(query, ["sortBy", "sort"]);
    const sortOrder = normalizeSortOrder(query.sortOrder ?? query.order);
    const sortField = sortBy || "createdAt";
    const total = items.length;

    items = [...items].sort((left, right) => {
      const pick = (item: TeacherListItem) => {
        switch (sortField) {
          case "name":
            return item.name;
          case "specialty":
            return item.specialty;
          case "courses":
          case "productCount":
            return item.productCount;
          case "students":
          case "totalStudents":
            return item.totalStudents;
          case "rating":
            return item.rating;
          case "createdAt":
          default:
            return item.createdAt;
        }
      };

      return compareListValues(pick(left), pick(right), sortOrder);
    });

    const pagination = parsePagination(query);
    return makeListResponse(paginateArray(items, pagination), total, pagination);
  },

  async listPublic(query?: { q?: string }) {
    const result = await this.list({ q: query?.q, deleted: false });
    return result.items.filter((item) => item.active);
  },

  async findUserByEmail(email: string) {
    return UserModel.findOne({
      email: String(email || "").trim().toLowerCase(),
      deletedAt: null,
    });
  },

  async findRawTeacherById(id: string) {
    if (!isValidObjectId(id)) return null;

    return TeacherModel.findById(id).populate({
      path: "user",
      select: "name email role active deletedAt",
    });
  },

  async findById(id: string) {
    if (!isValidObjectId(id)) return null;

    const teacher = await TeacherModel.findById(id)
      .populate({
        path: "user",
        select: "name email role active deletedAt",
      })
      .lean();

    if (!teacher) return null;

    const [mapped] = await mapTeachers([teacher as any]);
    return mapped || null;
  },

  async findByUserId(userId: string) {
    if (!isValidObjectId(userId)) return null;

    const teacher = await TeacherModel.findOne({
      user: userId,
      isDeleted: false,
    })
      .populate({
        path: "user",
        select: "name email role active deletedAt",
      })
      .lean();

    if (!teacher) return null;

    const [mapped] = await mapTeachers([teacher as any]);
    return mapped || null;
  },

  async createUser(
    payload: CreateTeacherInput,
    passwordHash: string,
    session: ClientSession
  ) {
    const docs = await UserModel.create(
      [
        {
          name: payload.name.trim(),
          email: payload.email.trim().toLowerCase(),
          passwordHash,
          role: ROLES.TEACHER,
          active: payload.active ?? true,
          deletedAt: null,
        },
      ],
      { session }
    );

    return docs[0];
  },

  async createTeacher(
    userId: string,
    payload: CreateTeacherInput,
    session: ClientSession
  ) {
    const docs = await TeacherModel.create(
      [
        {
          user: userId,
          specialty: payload.specialty?.trim() || "",
          phone: payload.phone?.trim() || "",
          avatar: payload.avatar?.trim() || "",
          avatarPublicId: payload.avatarPublicId?.trim() || "",

          degree: payload.degree?.trim() || "",
          experience: payload.experience?.trim() || "",
          achievement: payload.achievement?.trim() || "",
          bio: buildLegacyBio(payload),

          rating: payload.rating ?? 4.8,
          isActive: payload.active ?? true,
          isDeleted: false,
          deletedAt: null,
        },
      ],
      { session }
    );

    return docs[0];
  },

  async updateUser(
    userId: string,
    payload: UpdateTeacherInput & { passwordHash?: string },
    session: ClientSession
  ) {
    const updateData: Record<string, unknown> = {};

    if (payload.name !== undefined) updateData.name = payload.name.trim();
    if (payload.passwordHash !== undefined) {
      updateData.passwordHash = payload.passwordHash;
    }
    if (payload.active !== undefined) {
      updateData.active = payload.active;
    }

    if (Object.keys(updateData).length) {
      await UserModel.findByIdAndUpdate(userId, updateData, {
        session,
        new: true,
      });
    }
  },

  async updateTeacher(
    teacherId: string,
    payload: UpdateTeacherInput,
    session: ClientSession
  ) {
    const updateData: Record<string, unknown> = {};

    if (payload.specialty !== undefined) {
      updateData.specialty = payload.specialty.trim();
    }
    if (payload.phone !== undefined) {
      updateData.phone = payload.phone.trim();
    }
    if (payload.avatar !== undefined) {
      updateData.avatar = payload.avatar.trim();
    }
    if (payload.avatarPublicId !== undefined) {
      updateData.avatarPublicId = payload.avatarPublicId.trim();
    }
    if (payload.degree !== undefined) {
      updateData.degree = payload.degree.trim();
    }
    if (payload.experience !== undefined) {
      updateData.experience = payload.experience.trim();
    }
    if (payload.achievement !== undefined) {
      updateData.achievement = payload.achievement.trim();
    }
    if (payload.bio !== undefined) {
      updateData.bio = payload.bio.trim();
    }
    if (payload.rating !== undefined) {
      updateData.rating = payload.rating;
    }
    if (payload.active !== undefined) {
      updateData.isActive = payload.active;
    }

    if (Object.keys(updateData).length) {
      await TeacherModel.findByIdAndUpdate(teacherId, updateData, {
        session,
        new: true,
      });
    }
  },

  async setActive(
    teacherId: string,
    userId: string,
    active: boolean,
    session: ClientSession
  ) {
    await TeacherModel.findByIdAndUpdate(
      teacherId,
      { isActive: active },
      { session, new: true }
    );

    await UserModel.findByIdAndUpdate(
      userId,
      { active },
      { session, new: true }
    );
  },

  async softDelete(
    teacherId: string,
    userId: string,
    session: ClientSession
  ) {
    const now = new Date();

    await TeacherModel.findByIdAndUpdate(
      teacherId,
      {
        isActive: false,
        isDeleted: true,
        deletedAt: now,
      },
      { session, new: true }
    );

    await UserModel.findByIdAndUpdate(
      userId,
      {
        active: false,
        deletedAt: now,
      },
      { session, new: true }
    );
  },

  async restore(
    teacherId: string,
    userId: string,
    session: ClientSession
  ) {
    await TeacherModel.findByIdAndUpdate(
      teacherId,
      {
        isActive: true,
        isDeleted: false,
        deletedAt: null,
      },
      { session, new: true }
    );

    await UserModel.findByIdAndUpdate(
      userId,
      {
        active: true,
        deletedAt: null,
      },
      { session, new: true }
    );
  },

  async hardDelete(
    teacherId: string,
    userId: string,
    session: ClientSession
  ) {
    await ProductModel.updateMany(
      {
        $or: [{ teacher: teacherId }, { teacherName: { $exists: true } }],
      },
      [
        {
          $set: {
            teacher: {
              $cond: [{ $eq: ["$teacher", new Types.ObjectId(teacherId)] }, null, "$teacher"],
            },
            teacherName: {
              $cond: [{ $eq: ["$teacher", new Types.ObjectId(teacherId)] }, "", "$teacherName"],
            },
          },
        },
      ],
      { session }
    );

    await TeacherModel.deleteOne({ _id: teacherId }, { session });
    await UserModel.deleteOne({ _id: userId }, { session });
  },

  getUserIdFromTeacherDoc,
};
