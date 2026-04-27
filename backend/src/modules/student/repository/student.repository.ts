import { isValidObjectId } from "mongoose";
import { UserModel } from "../../user/user.model";
import {
  escapeRegex,
  getQueryString,
  makeListResponse,
  normalizeSortOrder,
  parsePagination,
  type ListQueryInput,
} from "../../../utils/list-query";

function buildListFilter(deleted: boolean, query: ListQueryInput) {
  const filter: Record<string, unknown> = {
    role: "STUDENT",
    deletedAt: deleted ? { $ne: null } : null,
  };

  const keyword = getQueryString(query, ["q", "search", "keyword"]);
  if (keyword) {
    const regex = new RegExp(escapeRegex(keyword), "i");
    filter.$or = [{ name: regex }, { email: regex }, { role: regex }];
  }

  const status = getQueryString(query, ["status"]).toUpperCase();
  if (!deleted && status === "ACTIVE") filter.active = true;
  if (!deleted && status === "LOCKED") filter.active = false;

  return filter;
}

function getListSort(deleted: boolean, query: ListQueryInput) {
  const sortBy = getQueryString(query, ["sortBy", "sort"]);
  const sortOrder = normalizeSortOrder(query.sortOrder ?? query.order);
  const sortFieldMap: Record<string, string> = {
    name: "name",
    email: "email",
    status: "active",
    active: "active",
    createdAt: "createdAt",
    deletedAt: "deletedAt",
  };

  const fallbackSort = deleted ? "deletedAt" : "createdAt";
  const sortField = sortFieldMap[sortBy] || fallbackSort;

  return { [sortField]: sortOrder, _id: sortOrder };
}

export const studentRepository = {
  async findAll(query: ListQueryInput = {}) {
    const filter = buildListFilter(false, query);
    const pagination = parsePagination(query);
    let mongoQuery = UserModel.find(filter)
      .select("-passwordHash")
      .sort(getListSort(false, query))
      .lean();

    if (pagination.enabled) {
      mongoQuery = mongoQuery.skip(pagination.skip).limit(pagination.limit);
    }

    const [total, items] = await Promise.all([
      UserModel.countDocuments(filter),
      mongoQuery,
    ]);

    return makeListResponse(items, total, pagination);
  },

  async findDeleted(query: ListQueryInput = {}) {
    const filter = buildListFilter(true, query);
    const pagination = parsePagination(query);
    let mongoQuery = UserModel.find(filter)
      .select("-passwordHash")
      .sort(getListSort(true, query))
      .lean();

    if (pagination.enabled) {
      mongoQuery = mongoQuery.skip(pagination.skip).limit(pagination.limit);
    }

    const [total, items] = await Promise.all([
      UserModel.countDocuments(filter),
      mongoQuery,
    ]);

    return makeListResponse(items, total, pagination);
  },

  findById(id: string) {
    if (!isValidObjectId(id)) return null;

    return UserModel.findOne({
      _id: id,
      role: "STUDENT",
      deletedAt: null,
    })
      .select("-passwordHash")
      .lean();
  },

  findDeletedById(id: string) {
    if (!isValidObjectId(id)) return null;

    return UserModel.findOne({
      _id: id,
      role: "STUDENT",
      deletedAt: { $ne: null },
    })
      .select("-passwordHash")
      .lean();
  },

  findAnyById(id: string) {
    if (!isValidObjectId(id)) return null;

    return UserModel.findOne({
      _id: id,
      role: "STUDENT",
    })
      .select("-passwordHash")
      .lean();
  },

  // check email theo luật unique toàn hệ thống, miễn deletedAt = null
  findByEmail(email: string) {
    return UserModel.findOne({
      email: email.trim().toLowerCase(),
      deletedAt: null,
    });
  },

  create(payload: {
    name: string;
    email: string;
    passwordHash: string;
    role: "STUDENT";
    active?: boolean;
    deletedAt?: null;
  }) {
    return UserModel.create(payload);
  },

  updateById(
    id: string,
    payload: Partial<{
      name: string;
      email: string;
      passwordHash: string;
      active: boolean;
    }>
  ) {
    return UserModel.findOneAndUpdate(
      {
        _id: id,
        role: "STUDENT",
        deletedAt: null,
      },
      { $set: payload },
      { new: true }
    )
      .select("-passwordHash")
      .lean();
  },

  setActive(id: string, active: boolean) {
    return UserModel.findOneAndUpdate(
      {
        _id: id,
        role: "STUDENT",
        deletedAt: null,
      },
      { $set: { active } },
      { new: true }
    )
      .select("-passwordHash")
      .lean();
  },

  softDeleteById(id: string) {
    return UserModel.findOneAndUpdate(
      {
        _id: id,
        role: "STUDENT",
        deletedAt: null,
      },
      {
        $set: {
          deletedAt: new Date(),
          active: false,
        },
      },
      { new: true }
    )
      .select("-passwordHash")
      .lean();
  },

  restoreById(id: string) {
    return UserModel.findOneAndUpdate(
      {
        _id: id,
        role: "STUDENT",
        deletedAt: { $ne: null },
      },
      {
        $set: {
          deletedAt: null,
          active: true,
        },
      },
      { new: true }
    )
      .select("-passwordHash")
      .lean();
  },

  forceDeleteById(id: string) {
    return UserModel.findOneAndDelete({
      _id: id,
      role: "STUDENT",
    })
      .select("-passwordHash")
      .lean();
  },
};
