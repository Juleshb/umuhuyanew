import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { env } from "./lib/env";
import { errorHandler } from "./middleware/error";
import authRoutes from "./routes/auth";
import propertyRoutes from "./routes/properties";
import agentRoutes from "./routes/agent";
import adminRoutes from "./routes/admin";
import favoriteRoutes from "./routes/favorites";
import inquiryRoutes from "./routes/inquiries";
import billingRoutes from "./routes/billing";
import bannerRoutes from "./routes/banners";

const app = express();

const allowedOrigins = new Set(
  [
    env.CLIENT_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://lvh.me:3000",
    "http://localtest.me:3000",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
  ].filter(Boolean)
);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser / same-origin tools (no Origin header)
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      // Local network Next.js preview (e.g. http://192.168.x.x:3000)
      if (/^http:\/\/(localhost|127\.0\.0\.1|lvh\.me|localtest\.me|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.\d+\.\d+\.\d+):\d+$/.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));

app.get("/api/v1/health", (_req, res) => {
  res.json({ ok: true, service: "umuhuza-api" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/properties", propertyRoutes);
app.use("/api/v1/agent", agentRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/favorites", favoriteRoutes);
app.use("/api/v1/inquiries", inquiryRoutes);
app.use("/api/v1/billing", billingRoutes);
app.use("/api/v1/banners", bannerRoutes);

app.use(errorHandler);

app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Umuhuza API listening on http://localhost:${env.PORT}`);
});
