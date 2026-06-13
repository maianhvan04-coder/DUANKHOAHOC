import { ClientSession, isValidObjectId } from "mongoose";
import { TeacherModel } from "./teacher.model";
import { UserModel } from "../user/user.model";
import { ClassRoomModel } from "../classroom/classroom.model";
import { StudentStudyModel } from "../student/student-study.model";
import { ROLES } from "../../constants/roles";
import UserRole from "../rbac/models/userRole.model";
import type {
  CreateTeacherInput,
  TeacherListItem,
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
  const [classCounts, studentCounts] = await Promise.all([
    ClassRoomModel.aggregate([
      {
        $match: {
          teacher: { $in: teacherIds },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$teacher",
          count: { $sum: 1 },
        },
      },
    ]),
    StudentStudyModel.aggregate([
      {
        $match: {
          teacher: { $in: teacherIds },
          isActive: true,
        },
      },
      {
        $group: {
          _id: "$teacher",
          students: { $addToSet: "$student" },
        },
      },
      {
        $project: {
          count: { $size: "$students" },
        },
      },
    ]),
  ]);

  const classCountMap = new Map(
    classCounts.map((item) => [String(item._id), Number(item.count || 0)])
  );
  const studentCountMap = new Map(
    studentCounts.map((item) => [String(item._id), Number(item.count || 0)])
  );

  return items
    .filter((item) => item.user)
    .map((item) => {
      const user = item.user as any;
      const teacherId = String(item._id);

      return {
        _id: teacherId,
        userId: String(user._id || ""),
        role: "TEACHER",
        name: String(item.name || user.name || ""),
        email: String(item.email || user.email || ""),
        specialty: String(item.specialty || ""),
        phone: String(item.phone || ""),
        avatar: String(item.avatar || ""),
        active: item.isActive !== false && user.active !== false,
        deletedAt: item.deletedAt ? new Date(item.deletedAt).toISOString() : null,
        classCount: classCountMap.get(teacherId) || 0,
        totalStudents: studentCountMap.get(teacherId) || 0,
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
      role: ROLES.TEACHER,
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
          case "classes":
          case "classCount":
            return item.classCount;
          case "students":
          case "totalStudents":
            return item.totalStudents;
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
          avatar: payload.avatar?.trim() || null,
          avatarPublicId: payload.avatarPublicId?.trim() || null,
          role: ROLES.TEACHER,
          active: true,
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
          role: ROLES.TEACHER,
          name: payload.name.trim(),
          email: payload.email.trim().toLowerCase(),
          specialty: "",
          phone: payload.phone?.trim() || "",
          avatar: payload.avatar?.trim() || "",
          avatarPublicId: payload.avatarPublicId?.trim() || "",
          isActive: true,
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
    if (payload.email !== undefined) {
      updateData.email = payload.email.trim().toLowerCase();
    }
    if (payload.passwordHash !== undefined) {
      updateData.passwordHash = payload.passwordHash;
    }
    if (payload.avatar !== undefined) {
      updateData.avatar = payload.avatar.trim() || null;
    }
    if (payload.avatarPublicId !== undefined) {
      updateData.avatarPublicId = payload.avatarPublicId.trim() || null;
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

    if (payload.name !== undefined) {
      updateData.name = payload.name.trim();
    }
    if (payload.email !== undefined) {
      updateData.email = payload.email.trim().toLowerCase();
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
    await TeacherModel.deleteOne({ _id: teacherId }, { session });
    await UserModel.deleteOne({ _id: userId }, { session });
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
      },
      { session }
    );
  },

  getUserIdFromTeacherDoc,
};
