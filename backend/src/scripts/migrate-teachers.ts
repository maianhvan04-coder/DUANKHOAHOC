import "dotenv/config";
import mongoose from "mongoose";
import { TeacherModel } from "../modules/teacher/teacher.model";
import { UserModel } from "../modules/user/user.model";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI in .env");
  }

  await mongoose.connect(uri);

  const users = await UserModel.find({ role: "TEACHER" })
    .select(
      "_id name email avatar avatarPublicId active deletedAt createdAt updatedAt"
    )
    .lean();

  const existingProfiles = await TeacherModel.find({
    user: { $in: users.map((user) => user._id) },
  })
    .select("user avatar avatarPublicId")
    .lean();
  const existingByUserId = new Map(
    existingProfiles.map((profile) => [String(profile.user), profile])
  );

  await TeacherModel.init();

  await TeacherModel.deleteMany({
    user: { $nin: users.map((user) => user._id) },
  });

  await TeacherModel.collection.updateMany(
    {},
    {
      $unset: {
        degree: "",
        experience: "",
        achievement: "",
        bio: "",
        rating: "",
      },
    }
  );

  if (users.length) {
    await UserModel.bulkWrite(
      users.flatMap((user) => {
        const current = existingByUserId.get(String(user._id));
        const avatar = user.avatar || current?.avatar || "";
        const avatarPublicId =
          user.avatarPublicId || current?.avatarPublicId || "";

        if (!avatar && !avatarPublicId) return [];

        return [
          {
            updateOne: {
              filter: { _id: user._id },
              update: {
                $set: {
                  avatar: avatar || null,
                  avatarPublicId: avatarPublicId || null,
                },
              },
            },
          },
        ];
      })
    );

    await TeacherModel.collection.bulkWrite(
      users.map((user) => {
        const current = existingByUserId.get(String(user._id));

        return {
          updateOne: {
            filter: { user: user._id },
            update: {
              $set: {
                role: "TEACHER",
                name: user.name,
                email: user.email,
                avatar: user.avatar || current?.avatar || "",
                avatarPublicId:
                  user.avatarPublicId || current?.avatarPublicId || "",
                isActive: user.active !== false && !user.deletedAt,
                isDeleted: Boolean(user.deletedAt),
                deletedAt: user.deletedAt ?? null,
                updatedAt: user.updatedAt ?? new Date(),
              },
              $setOnInsert: {
                user: user._id,
                phone: "",
                specialty: "",
                createdAt: user.createdAt ?? new Date(),
              },
            },
            upsert: true,
          },
        };
      })
    );
  }

  const profileCount = await TeacherModel.countDocuments();
  const incompleteCount = await TeacherModel.countDocuments({
    $or: [
      { name: { $exists: false } },
      { name: "" },
      { email: { $exists: false } },
      { email: "" },
    ],
  });
  const invalidRoleCount = await TeacherModel.countDocuments({
    role: { $ne: "TEACHER" },
  });
  const legacyFieldCount = await TeacherModel.countDocuments({
    $or: [
      { degree: { $exists: true } },
      { experience: { $exists: true } },
      { achievement: { $exists: true } },
      { bio: { $exists: true } },
      { rating: { $exists: true } },
    ],
  });
  const profiles = await TeacherModel.find()
    .select("user role name email phone")
    .lean();
  const userById = new Map(users.map((user) => [String(user._id), user]));
  const mismatchedProfiles = profiles.filter((profile) => {
    const user = userById.get(String(profile.user));

    return (
      !user ||
      profile.role !== "TEACHER" ||
      profile.name !== user.name ||
      profile.email !== user.email
    );
  });

  if (incompleteCount > 0) {
    throw new Error(
      `${incompleteCount} teacher profile(s) are missing name or email`
    );
  }

  if (invalidRoleCount > 0) {
    throw new Error(
      `${invalidRoleCount} teacher profile(s) do not have role TEACHER`
    );
  }

  if (legacyFieldCount > 0) {
    throw new Error(
      `${legacyFieldCount} teacher profile(s) still contain removed fields`
    );
  }

  if (mismatchedProfiles.length > 0) {
    throw new Error(
      `${mismatchedProfiles.length} teacher profile(s) do not match their linked user`
    );
  }

  if (profileCount !== users.length) {
    throw new Error(
      `Teacher collection has ${profileCount} document(s), but users has ${users.length} TEACHER account(s)`
    );
  }

  console.log(
    `Migrated ${users.length} teacher profile(s). Teacher collection contains ${profileCount} document(s).`
  );
  console.log(
    `Verified ${profiles.length} linked profile(s); removed fields remaining: ${legacyFieldCount}; ${profiles.filter((profile) => profile.phone.trim()).length} have phone numbers.`
  );
}

main()
  .catch((error) => {
    console.error("Teacher migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
