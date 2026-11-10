import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.js";
import platformRoutes from "./routes/platform.js";
import { authenticate } from "./middleware.js";
import { prisma } from "./db.js";

if (!process.env.DATABASE_URL || !process.env.JWT_SECRET)
  throw new Error("DATABASE_URL va JWT_SECRET .env faylida bo‘lishi shart.");
const app = express();
app.use((helmet as any)());
app.use(cors(),);
app.use(express.json({ limit: "2mb" }));
app.get("/api/health", (_req, res) =>
  res.json({ success: true, message: "CHSB API ishlayapti" }),
);
app.use("/api/auth", authRoutes);
app.use("/api", authenticate, platformRoutes);
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    if (err?.name === "ZodError")
      return res
        .status(400)
        .json({
          success: false,
          message: "Yuborilgan ma’lumotlar noto‘g‘ri.",
          errors: err.issues,
        });
    if (err?.code === "P2002")
      return res
        .status(409)
        .json({
          success: false,
          message: "Bu qiymat avval ro‘yxatdan o‘tgan.",
        });
    if (err?.code === "P2025")
      return res
        .status(404)
        .json({ success: false, message: "Ma’lumot topilmadi." });
    return res
      .status(500)
      .json({ success: false, message: "Serverda xatolik yuz berdi." });
  },
);
const port = Number(process.env.PORT ?? 5000);
const server = app.listen(port, () =>
  console.log(`CHSB API: http://localhost:${port}/api`),
);
const shutdown = async () => {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
