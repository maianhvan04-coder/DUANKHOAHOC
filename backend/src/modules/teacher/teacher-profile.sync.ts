import type { ClientSession } from "mongoose";
import { UserModel } from "../user/user.model";
import { TeacherModel } from "./teacher.model";

export async function syncTeacherProfileForUser(
  userId: string,
  session?: ClientSession
) {
  const user = await UserModel.findById(userId)
    .session(session ?? null)
    .select("name email role avatar avatarPublicId active deletedAt")
    .lean();

  if (!user || String(user.role || "").toUpperCase() !== "TEACHER") {
    await TeacherModel.deleteOne({ user: userId }, { session });
    return false;
  }

  const currentProfile = await TeacherModel.findOne({ user: userId })
    .session(session ?? null)
    .select("avatar avatarPublicId")
    .lean();

  await TeacherModel.updateOne(
    { user: userId },
    {
      $set: {
        role: "TEACHER",
        name: user.name,
        email: user.email,
        avatar: user.avatar || currentProfile?.avatar || "",
        avatarPublicId:
          user.avatarPublicId || currentProfile?.avatarPublicId || "",
        isActive: user.active !== false && !user.deletedAt,
        isDeleted: Boolean(user.deletedAt),
        deletedAt: user.deletedAt ?? null,
      },
      $setOnInsert: {
        user: user._id,
        phone: "",
        specialty: "",
      },
    },
    {
      upsert: true,
      runValidators: true,
      session,
    }
  );

  return true;
}
