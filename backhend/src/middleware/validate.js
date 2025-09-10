// src/middleware/validate.js
import { validationResult } from "express-validator";

/**
 * Collects express-validator errors and returns 400 if any.
 * Use after your validator arrays, before the controller.
 */
export const handleValidation = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: result.array().map((e) => ({
        field: e.path,
        message: e.msg,
        value: e.value,
        location: e.location,
      })),
    });
  }
  next();
};
