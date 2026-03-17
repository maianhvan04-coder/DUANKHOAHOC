import "dotenv/config";
import { createApp } from "./app";
import { connectDB } from "./config/db";

const app = createApp();
const port = Number(process.env.PORT) || 8080;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`🚀 BE running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connect failed:", err);
    process.exit(1);
  });
