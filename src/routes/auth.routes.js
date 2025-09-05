// src/routes/auth.routes.js
import { Router } from "express";
import { body } from "express-validator";
import { handleValidation } from "../middleware/validate.js";
import { register, login, refresh, logout } from "../controllers/auth.controller.js";

const router = Router();

// Quick ping to confirm mount
router.get("/", (_req, res) => res.json({ ok: true, where: "auth" }));

// Register
router.post(
  "/register",
  [
    body("username").isString().isLength({ min: 3 }),
    body("fullname").isString().isLength({ min: 2 }),
    body("email").isEmail(),
    body("password").isString().isLength({ min: 8 }),
    body("avatar").optional().isString(),
  ],
  handleValidation,
  register
);

// Login
router.post(
  "/login",
  [body("email").isEmail(), body("password").isString().isLength({ min: 8 })],
  handleValidation,
  login
);

// Refresh (accepts body.refreshToken unless you enable cookie mode)
router.post("/refresh", refresh);

// Logout (clears cookie if cookie mode is on)
router.post("/logout", logout);

export default router;
