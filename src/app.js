// src/app.js
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import path from "node:path";
import { fileURLToPath } from "node:url";

import routes from "./routes/index.js"; // mounts sub-routers (e.g., /pets, /auth, etc.)

const app = express();

app.set("trust proxy", true);
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(compression());

// ---- Static: serve uploaded images (used by Multer) ----
const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
// resolve to project root (.. from src/)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsAbs = path.join(__dirname, "..", UPLOAD_DIR);
app.use("/uploads", express.static(uploadsAbs));

// Health
app.get("/health", (_req, res) => res.json({ status: "ok", uptime: process.uptime() }));

// ***** MOUNT API ROUTES HERE (must be BEFORE 404) *****
app.use("/api", routes);

// TEMP ping to prove mount even if index router fails
app.get("/api/_ping", (_req, res) => res.json({ ok: true, where: "app-api" }));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: "Route not found" }));

export default app;
