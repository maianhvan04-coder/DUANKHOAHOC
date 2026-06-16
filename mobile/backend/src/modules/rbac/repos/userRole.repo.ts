import { Types } from "mongoose";
import UserRole from "../models/userRole.model";

function badRequest(message: string) {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = 400;
  return error;
}

function toObjectId(value: string | Types.ObjectId): Types.ObjectId {
  if (value instanceof Types.ObjectId) return value;

  if (!Types.ObjectId.isValid(value)) {
    throw badRequest("ObjectId không hợp lệ");
  }

  return new Types.ObjectId(value);
}

export const userRoleRepo = {
  async replaceRolesForUser(
    userId: string | Types.ObjectId,
    roleIds: Array<string | Types.ObjectId>
  ) {
    const normalizedUserId = toObjectId(userId);

    const normalizedRoleIds = [
      ...new Set(roleIds.map((roleId) => String(toObjectId(roleId)))),
    ].map((id) => new Types.ObjectId(id));

    await UserRole.updateMany(
      {
        userId: normalizedUserId,
        isDeleted: false,
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      }
    );

    if (!normalizedRoleIds.length) return;

    await UserRole.bulkWrite(
      normalizedRoleIds.map((roleId) => ({
        updateOne: {
          filter: {
            userId: normalizedUserId,
            roleId,
          },
          update: {
            $set: {
              isDeleted: false,
              deletedAt: null,
            },
            $setOnInsert: {
              userId: normalizedUserId,
              roleId,
            },
          },
          upsert: true,
        },
      }))
    );
  },

  async findActiveRoleIdsByUserId(userId: string | Types.ObjectId) {
    const normalizedUserId = toObjectId(userId);

    const rows = await UserRole.find({
      userId: normalizedUserId,
      isDeleted: false,
    })
      .select("roleId")
      .lean();

    return rows
      .map((row) => row.roleId)
      .filter(Boolean) as Types.ObjectId[];
  },
};