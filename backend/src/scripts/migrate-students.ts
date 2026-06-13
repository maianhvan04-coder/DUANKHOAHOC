import "dotenv/config";
import mongoose from "mongoose";
import { StudentModel } from "../modules/student/student.model";
import { UserModel } from "../modules/user/user.model";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI in .env");
  }

  await mongoose.connect(uri);

  const roleCounts = await UserModel.aggregate<{
    _id: string | null;
    count: number;
  }>([
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const users = await UserModel.find({ role: "STUDENT" })
    .select("_id name email active deletedAt createdAt updatedAt")
    .lean();

  await StudentModel.init();

  await StudentModel.deleteMany({
    user: { $nin: users.map((user) => user._id) },
  });

  if (users.length) {
    await StudentModel.collection.bulkWrite(
      users.map((user) => ({
        updateOne: {
          filter: { user: user._id },
          update: {
            $set: {
              role: "STUDENT",
              name: user.name,
              email: user.email,
              isActive: user.active !== false && !user.deletedAt,
              isDeleted: Boolean(user.deletedAt),
              deletedAt: user.deletedAt ?? null,
              updatedAt: user.updatedAt ?? new Date(),
            },
            $setOnInsert: {
              user: user._id,
              createdAt: user.createdAt ?? new Date(),
            },
          },
          upsert: true,
        },
      }))
    );
  }

  const profileCount = await StudentModel.countDocuments();
  const incompleteCount = await StudentModel.countDocuments({
    $or: [
      { name: { $exists: false } },
      { name: "" },
      { email: { $exists: false } },
      { email: "" },
    ],
  });
  const invalidRoleCount = await StudentModel.countDocuments({
    role: { $ne: "STUDENT" },
  });

  if (incompleteCount > 0) {
    throw new Error(
      `${incompleteCount} student profile(s) are missing name or email`
    );
  }

  if (invalidRoleCount > 0) {
    throw new Error(
      `${invalidRoleCount} student profile(s) do not have role STUDENT`
    );
  }

  if (profileCount !== users.length) {
    throw new Error(
      `Student collection has ${profileCount} document(s), but users has ${users.length} STUDENT account(s)`
    );
  }

  console.log(
    `Migrated ${users.length} student profile(s). Student collection contains ${profileCount} document(s).`
  );
  console.log("User role counts:", roleCounts);
}

main()
  .catch((error) => {
    console.error("Student migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
