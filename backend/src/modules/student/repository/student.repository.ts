import { isValidObjectId } from "mongoose";
import { UserModel } from "../../user/user.model";

export const studentRepository = {
  findAll() {
    return UserModel.find({
      role: "STUDENT",
      deletedAt: null,
    })
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .lean();
  },

  findDeleted() {
    return UserModel.find({
      role: "STUDENT",
      deletedAt: { $ne: null },
    })
      .select("-passwordHash")
      .sort({ deletedAt: -1 })
      .lean();
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