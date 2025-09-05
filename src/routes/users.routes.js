// src/routes/users.routes.js
import { Router } from "express";
import { auth, requireSuperAdmin } from "../middleware/auth.js";
import {
  getMe,
   updateMe, 
   changeMyPassword,
  listUsers,
   getUserById, 
   deleteUserById,
} from "../controllers/users.controller.js";
import {
  updateMeValidator, 
  changePasswordValidator,
  userIdParamValidator,
} from "../validations/user.validation.js";
import { handleValidation } from "../middleware/validate.js";

const router = Router();

/** Me (all users) */
router.get("/me", auth, getMe);
router.patch("/me", auth, updateMeValidator, handleValidation, updateMe);
router.patch("/me/password", auth, changePasswordValidator, handleValidation, changeMyPassword);

/** SuperAdmin moderation */
router.get("/", auth, requireSuperAdmin, listUsers);
router.get("/:id", auth, requireSuperAdmin, userIdParamValidator, handleValidation, getUserById);
router.delete("/:id", auth, requireSuperAdmin, userIdParamValidator, handleValidation, deleteUserById);

export default router;
