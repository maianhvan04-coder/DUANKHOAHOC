import { isValidObjectId } from "mongoose";
import { UserModel } from "./user.model";

type CreateUserInput = { name: string; email: string; role?: string };
type UpdateUserInput = Partial<{ name: string; email: string; role: string }>;

export const userService = {
  // deleted=false => Users tab | deleted=true => Deleted tab
  async list(deleted: boolean) {
    const filter = deleted ? { deletedAt: { $ne: null } } : { deletedAt: null };
    return UserModel.find(filter).sort({ createdAt: -1 }).select("-passwordHash").lean();
  },

  async getById(id: string) {
    if (!isValidObjectId(id)) return null;
    return UserModel.findById(id).select("-passwordHash").lean();
  },

  async create(data: CreateUserInput) {
    const doc = await UserModel.create({
      ...data,
      active: true,
      deletedAt: null,
    });

    const obj = doc.toObject() as { passwordHash?: unknown } & Record<string, unknown>;
    const { passwordHash: _pw, ...safe } = obj;
    return safe;
  },

  async update(id: string, data: UpdateUserInput) {
    if (!isValidObjectId(id)) return null;

    // chỉ update được user chưa soft-delete
    return UserModel.findOneAndUpdate({ _id: id, deletedAt: null }, data, { new: true })
      .select("-passwordHash")
      .lean();
  },

  // ✅ click ACTIVE/INACTIVE (chỉ cho Users tab)
  async setActive(id: string, active: boolean) {
    if (!isValidObjectId(id)) return null;

    return UserModel.findOneAndUpdate({ _id: id, deletedAt: null }, { active }, { new: true })
      .select("-passwordHash")
      .lean();
  },

  // ✅ soft delete: chuyển sang Deleted + set INACTIVE
  async softRemove(id: string) {
    if (!isValidObjectId(id)) return false;

    const u = await UserModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date(), active: false },
      { new: true }
    ).lean();

    return !!u;
  },

  // ✅ hard delete: xoá vĩnh viễn (chỉ khi đang ở Deleted)
  async hardRemove(id: string) {
    if (!isValidObjectId(id)) return false;

    const deleted = await UserModel.findOneAndDelete({ _id: id, deletedAt: { $ne: null } }).lean();
    return !!deleted;
  },

  // ✅ restore: từ Deleted về Users + set ACTIVE (đúng yêu cầu của bạn)
  async restore(id: string) {
    if (!isValidObjectId(id)) return false;

    const u = await UserModel.findOneAndUpdate(
      { _id: id, deletedAt: { $ne: null } },
      { deletedAt: null, active: true },
      { new: true }
    ).lean();

    return !!u;
  },
};