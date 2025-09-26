// src/controllers/password.controller.js
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import {User} from "../models/User.js";
import PasswordResetToken from "../models/PasswordResetToken.js";

const RESET_TTL_MIN = Number(process.env.PASSWORD_RESET_TTL_MIN || 30);

function buildResetUrl(req, token) {
  const appUrl = process.env.APP_BASE_URL || "http://localhost:5173";
  return `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
}

// Replace with nodemailer if you have SMTP; here we log to server console.
async function sendResetEmailLike(email, link) {
  console.log(`[Password Reset] Send to ${email}: ${link}`);
  return true;
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(200).json({ success: true }); // privacy

    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select("+password");
    if (!user) return res.status(200).json({ success: true }); // privacy

    // Invalidate old tokens
    await PasswordResetToken.updateMany({ user: user._id, used: false }, { $set: { used: true } });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + RESET_TTL_MIN * 60 * 1000);

    await PasswordResetToken.create({ user: user._id, token, expiresAt });

    const link = buildResetUrl(req, token);
    await sendResetEmailLike(user.email, link);

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ success: false, message: "token and password are required" });
    if (String(password).length < 8 || String(password).length > 16) {
      return res.status(400).json({ success: false, message: "Password must be 8–16 characters" });
    }

    const row = await PasswordResetToken.findOne({ token, used: false });
    if (!row) return res.status(400).json({ success: false, message: "Invalid or expired token" });
    if (row.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    const user = await User.findById(row.user).select("+password");
    if (!user) return res.status(400).json({ success: false, message: "Invalid token" });

    user.password = await bcrypt.hash(String(password), 10);
    await user.save();

    row.used = true;
    await row.save();

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
