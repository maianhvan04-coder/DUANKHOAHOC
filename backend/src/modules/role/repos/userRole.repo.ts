// src/modules/role/repos/userRole.repo.ts

import type { ClientSession, Types } from "mongoose";
import { UserRole } from "../models/userRole.model";

type RepoOpts = { session?: ClientSession };

export const userRoleRepo = {
  // restore tất cả quan hệ role của các user đó
  restoreManyByUserIds: (
    userIds: Array<string | Types.ObjectId>,
    opts: RepoOpts = {}
  ) => {
    const update = {
      $set: {
        isDeleted: false,
        deletedAt: null,
      },
    };

    return UserRole.updateMany({ userId: { $in: userIds } }, update, {
      session: opts.session,
    });
  },

  restoreManyByUserIdsAndRoleIds: (
    userIds: Array<string | Types.ObjectId>,
    roleIds: Array<string | Types.ObjectId>,
    opts: RepoOpts = {}
  ) => {
    const update = {
      $set: {
        isDeleted: false,
        deletedAt: null,
      },
    };

    return UserRole.updateMany(
      { userId: { $in: userIds }, roleId: { $in: roleIds } },
      update,
      { session: opts.session }
    );
  },
};