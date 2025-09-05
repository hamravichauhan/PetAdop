// src/controllers/auth.controller.js
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const useCookie = (process.env.USE_REFRESH_COOKIE || "false").toLowerCase() === "true";

// Helper to optionally set refresh cookie
function maybeSetRefreshCookie(res, refreshToken) {
  if (!useCookie) return;
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
  });
}

export const register = async (req, res, next) => {
  try {
    let { username, fullname, email, password, avatar } = req.body;

    // Normalize
    username = (username || "").trim();
    fullname = (fullname || "").trim();
    email = (email || "").trim().toLowerCase();

    // Prevent duplicates (case-insensitive username)
    const exists = await User.findOne({
      $or: [{ email }, { username: new RegExp(`^${username}$`, "i") }],
    });
    if (exists) {
      return res.status(409).json({ success: false, message: "Email or username already in use" });
    }

    const user = await User.create({ username, fullname, email, password, avatar });

    // Public view (password hidden via select:false in model)
    const publicUser = await User.findById(user._id);

    // Tokens
    const accessToken = publicUser.generateAccessToken();
    const refreshToken = publicUser.generateRefreshToken();
    maybeSetRefreshCookie(res, refreshToken);

    return res.status(201).json({
      success: true,
      data: publicUser,
      tokens: { accessToken, refreshToken: useCookie ? undefined : refreshToken },
    });
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(409).json({ success: false, message: "Email or username already in use" });
    }
    next(e);
  }
};

export const login = async (req, res, next) => {
  try {
    let { email, password } = req.body;
    email = (email || "").trim().toLowerCase();

    const userWithPassword = await User.findOne({ email }).select("+password");
    if (!userWithPassword) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const ok = await userWithPassword.isPasswordCorrect(password);
    if (!ok) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const user = await User.findById(userWithPassword._id);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    maybeSetRefreshCookie(res, refreshToken);

    return res.json({
      success: true,
      data: user,
      tokens: { accessToken, refreshToken: useCookie ? undefined : refreshToken },
    });
  } catch (e) {
    next(e);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const fromCookie = req.cookies?.refreshToken;
    const fromBody = req.body?.refreshToken;
    const refreshToken = useCookie ? fromCookie : (fromBody || fromCookie);

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: "Refresh token required" });
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: "Invalid refresh token" });
    }

    const user = await User.findById(payload._id);
    if (!user) return res.status(401).json({ success: false, message: "User not found" });

    const accessToken = user.generateAccessToken();
    return res.json({ success: true, accessToken });
  } catch (e) {
    next(e);
  }
};

export const logout = async (_req, res, _next) => {
  if (useCookie) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }
  return res.json({ success: true, message: "Logged out" });
};
