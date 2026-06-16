import type { ClientSession } from "mongoose";
import { UserModel } from "../user/user.model";
import { StudentStudyModel } from "./student-study.model";
import { StudentModel } from "./student.model";

export async function syncStudentProfileForUser(
  userId: string,
  session?: ClientSession
) {
  const user = await UserModel.findById(userId)
    .session(session ?? null)
    .select("name email role active deletedAt")
    .lean();

  if (!user || String(user.role || "").toUpperCase() !== "STUDENT") {
    await StudentModel.deleteOne({ user: userId }, { session });
    await StudentStudyModel.updateMany(
      { student: userId },
      { $set: { isActive: false } },
      { session }
    );
    return false;
  }

  await StudentModel.updateOne(
    { user: userId },
    {
      $set: {
        role: "STUDENT",
        name: user.name,
        email: user.email,
        isActive: user.active !== false && !user.deletedAt,
        isDeleted: Boolean(user.deletedAt),
        deletedAt: user.deletedAt ?? null,
      },
      $setOnInsert: {
        user: user._id,
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
