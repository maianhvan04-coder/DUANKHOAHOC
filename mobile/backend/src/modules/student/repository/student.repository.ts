import { ClientSession, isValidObjectId } from "mongoose";
import { UserModel } from "../../user/user.model";
import { StudentModel } from "../student.model";
import {
  compareListValues,
  escapeRegex,
  getQueryString,
  makeListResponse,
  normalizeSortOrder,
  paginateArray,
  parsePagination,
  type ListQueryInput,
} from "../../../utils/list-query";

const userPopulate = {
  path: "user",
  select: "name email role active deletedAt createdAt updatedAt",
};

function mapStudent(item: any) {
  const user = item?.user;
  if (!user?._id || String(user.role || "").toUpperCase() !== "STUDENT") {
    return null;
  }

  return {
    _id: String(user._id),
    studentId: String(item._id),
    userId: String(user._id),
    name: String(user.name || item.name || ""),
    email: String(user.email || item.email || ""),
    role: String(user.role || "STUDENT"),
    active: item.isActive !== false && user.active !== false,
    deletedAt:
      item.deletedAt || user.deletedAt
        ? new Date(item.deletedAt || user.deletedAt).toISOString()
        : null,
    createdAt: user.createdAt
      ? new Date(user.createdAt).toISOString()
      : item.createdAt
        ? new Date(item.createdAt).toISOString()
        : "",
    updatedAt: user.updatedAt
      ? new Date(user.updatedAt).toISOString()
      : item.updatedAt
        ? new Date(item.updatedAt).toISOString()
        : "",
  };
}

async function listStudents(deleted: boolean, query: ListQueryInput) {
  const filter: Record<string, unknown> = {
    role: "STUDENT",
    isDeleted: deleted,
  };

  const keyword = getQueryString(query, ["q", "search", "keyword"]);
  if (keyword) {
    const regex = new RegExp(escapeRegex(keyword), "i");
    const matchedUsers = await UserModel.find({
      role: "STUDENT",
      $or: [{ name: regex }, { email: regex }],
    })
      .select("_id")
      .lean();

    filter.user = { $in: matchedUsers.map((item) => item._id) };
  }

  const profiles = await StudentModel.find(filter)
    .populate(userPopulate)
    .lean();

  let items = profiles
    .map(mapStudent)
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const status = getQueryString(query, ["status"]).toUpperCase();
  if (!deleted && status === "ACTIVE") {
    items = items.filter((item) => item.active);
  }
  if (!deleted && status === "LOCKED") {
    items = items.filter((item) => !item.active);
  }

  const sortBy =
    getQueryString(query, ["sortBy", "sort"]) ||
    (deleted ? "deletedAt" : "createdAt");
  const sortOrder = normalizeSortOrder(query.sortOrder ?? query.order);

  items = [...items].sort((left, right) => {
    const pick = (item: (typeof items)[number]) => {
      switch (sortBy) {
        case "name":
          return item.name;
        case "email":
          return item.email;
        case "status":
        case "active":
          return item.active;
        case "deletedAt":
          return item.deletedAt;
        case "createdAt":
        default:
          return item.createdAt;
      }
    };

    return compareListValues(pick(left), pick(right), sortOrder);
  });

  const pagination = parsePagination(query);
  return makeListResponse(
    paginateArray(items, pagination),
    items.length,
    pagination
  );
}

function findProfileByUserId(userId: string, deleted: boolean | null) {
  if (!isValidObjectId(userId)) return null;

  const filter: Record<string, unknown> = {
    user: userId,
    role: "STUDENT",
  };
  if (deleted !== null) filter.isDeleted = deleted;

  return StudentModel.findOne(filter).populate(userPopulate);
}

export const studentRepository = {
  findAll(query: ListQueryInput = {}) {
    return listStudents(false, query);
  },

  findDeleted(query: ListQueryInput = {}) {
    return listStudents(true, query);
  },

  async findById(userId: string) {
    const profile = await findProfileByUserId(userId, false);
    return profile ? mapStudent(profile.toObject()) : null;
  },

  async findDeletedById(userId: string) {
    const profile = await findProfileByUserId(userId, true);
    return profile ? mapStudent(profile.toObject()) : null;
  },

  async findAnyById(userId: string) {
    const profile = await findProfileByUserId(userId, null);
    return profile ? mapStudent(profile.toObject()) : null;
  },

  findByEmail(email: string) {
    return UserModel.findOne({
      email: email.trim().toLowerCase(),
      deletedAt: null,
    });
  },

  async createUser(
    payload: {
      name: string;
      email: string;
      passwordHash: string;
      active?: boolean;
    },
    session: ClientSession
  ) {
    const docs = await UserModel.create(
      [
        {
          ...payload,
          role: "STUDENT",
          deletedAt: null,
        },
      ],
      { session }
    );

    return docs[0];
  },

  async createStudent(
    userId: string,
    payload: {
      name: string;
      email: string;
      active: boolean;
    },
    session: ClientSession
  ) {
    const user = await UserModel.findOne({
      _id: userId,
      role: "STUDENT",
    })
      .session(session)
      .select("_id")
      .lean();

    if (!user) {
      throw new Error(
        "Chỉ tài khoản có role STUDENT mới được tạo hồ sơ học viên"
      );
    }

    const docs = await StudentModel.create(
      [
        {
          user: userId,
          role: "STUDENT",
          name: payload.name,
          email: payload.email,
          isActive: payload.active,
          isDeleted: false,
          deletedAt: null,
        },
      ],
      { session }
    );

    return docs[0];
  },

  updateUser(
    userId: string,
    payload: Partial<{
      name: string;
      email: string;
      passwordHash: string;
      active: boolean;
    }>,
    session: ClientSession
  ) {
    return UserModel.findOneAndUpdate(
      {
        _id: userId,
        role: "STUDENT",
        deletedAt: null,
      },
      { $set: payload },
      { new: true, session }
    );
  },

  updateStudent(
    userId: string,
    payload: Partial<{
      name: string;
      email: string;
      isActive: boolean;
    }>,
    session: ClientSession
  ) {
    return StudentModel.findOneAndUpdate(
      {
        user: userId,
        role: "STUDENT",
        isDeleted: false,
      },
      { $set: payload },
      { new: true, session }
    );
  },

  async setActive(
    userId: string,
    active: boolean,
    session: ClientSession
  ) {
    await UserModel.updateOne(
      { _id: userId, role: "STUDENT", deletedAt: null },
      { $set: { active } },
      { session }
    );
    await StudentModel.updateOne(
      { user: userId, role: "STUDENT", isDeleted: false },
      { $set: { isActive: active } },
      { session }
    );
  },

  async softDeleteById(userId: string, session: ClientSession) {
    const now = new Date();

    await UserModel.updateOne(
      { _id: userId, role: "STUDENT", deletedAt: null },
      { $set: { deletedAt: now, active: false } },
      { session }
    );
    await StudentModel.updateOne(
      { user: userId, role: "STUDENT", isDeleted: false },
      {
        $set: {
          deletedAt: now,
          isActive: false,
          isDeleted: true,
        },
      },
      { session }
    );
  },

  async restoreById(userId: string, session: ClientSession) {
    await UserModel.updateOne(
      { _id: userId, role: "STUDENT", deletedAt: { $ne: null } },
      { $set: { deletedAt: null, active: true } },
      { session }
    );
    await StudentModel.updateOne(
      { user: userId, role: "STUDENT", isDeleted: true },
      {
        $set: {
          deletedAt: null,
          isActive: true,
          isDeleted: false,
        },
      },
      { session }
    );
  },

  async forceDeleteById(userId: string, session: ClientSession) {
    await StudentModel.deleteOne(
      { user: userId, role: "STUDENT" },
      { session }
    );
    await UserModel.deleteOne(
      { _id: userId, role: "STUDENT" },
      { session }
    );
  },
};
