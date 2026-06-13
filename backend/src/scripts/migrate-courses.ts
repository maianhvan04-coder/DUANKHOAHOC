import "dotenv/config";
import mongoose from "mongoose";
import { ProductModel } from "../modules/course/course.model";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI in .env");
  }

  await mongoose.connect(uri);

  const result = await ProductModel.collection.updateMany(
    {},
    {
      $unset: {
        teacher: "",
        teacherName: "",
        rating: "",
      },
    }
  );

  const remaining = await ProductModel.collection.countDocuments({
    $or: [
      { teacher: { $exists: true } },
      { teacherName: { $exists: true } },
      { rating: { $exists: true } },
    ],
  });

  console.log(
    `Updated ${result.modifiedCount} course document(s); removed fields remaining: ${remaining}.`
  );

  if (remaining > 0) {
    throw new Error("Course migration verification failed");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
