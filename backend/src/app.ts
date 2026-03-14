import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { router } from "./routes";
import { errorHandler } from "./middlewares/errorHandler";

export function createApp() {
  const app = express();

  const origin = process.env.CORS_ORIGIN || "http://localhost:3000";

  app.use(
    cors({
      origin,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // ✅ preflight (đừng dùng "*")
  app.options(/.*/, cors({ origin, credentials: true }));

  app.use(express.json());
  app.use(cookieParser());

  app.use("/api", router);

  app.use((_req, res) => res.status(404).json({ message: "Route not found" }));
  app.use(errorHandler);

  return app;
}
