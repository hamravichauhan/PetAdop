// src/routes/index.js
import { Router } from "express";
import authRoutes from "./auth.routes.js";
import adoptionsRoutes from "./adoptions.routes.js";
import usersRoutes from "./users.routes.js";
import petsRoutes from "./pets.routes.js";

const router = Router();

// PING to verify this index router is mounted at /api
router.get("/", (_req, res) => res.json({ ok: true, where: "api-index" }));

router.use("/auth", authRoutes);
router.use("/adoptions", adoptionsRoutes);
router.use("/users", usersRoutes);
router.use("/pets", petsRoutes);

export default router;
