// src/modules/role/repos/role.repo.ts

import { ClientSession, Types } from "mongoose";
import { toId, toIds } from "../../../utils/mongo";
import { Role } from "../models/role.model";
import { RoleCreatePayload } from "../role.types";

type RepoOpts = { session?: ClientSession };

export const roleRepo = {
    findByCodeLean: async ( code : string ) => {
        const doc = await Role.findOne({ code }).lean();
        return doc ? toId(doc as any) :null;
    },

    findById: (id: string | Types.ObjectId) => Role.findById(id),

  create: (payload: RoleCreatePayload) => Role.create(payload),

  deleteById: (id: string | Types.ObjectId) =>
    Role.updateOne({ _id: id }, { $set: { isDeleted: true } }),

  existsByCode: async (code: string) => {
    const doc = await Role.findOne({ code }).select("_id").lean();
    return !!doc;
  },

  existsByCodeExceptId: async (code: string, id: string | Types.ObjectId) => {
    const doc = await Role.findOne({ code, _id: { $ne: id } }).select("_id").lean();
    return !!doc;
  },

  findActiveRoleIds: async (opts: RepoOpts = {}) => {
    const q = Role.find({ isDeleted: false, isActive: true }).select("_id");
    if (opts.session) q.session(opts.session);
    const rows = await q.lean<{ _id: Types.ObjectId }[]>();
    return rows.map((r) => String(r._id));
  },

  listActiveLean: async () => {
    const rows = await Role.find({ isDeleted: false, isActive: true })
      .sort({ priority: -1, code: 1 })
      .lean();
    return toIds(rows as any); // ✅ [{id,...}] cho FE
  },
};