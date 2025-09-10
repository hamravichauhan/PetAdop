// src/middleware/auth.js
import jwt from "jsonwebtoken";

function getAccessSecret() {
  // Support multiple env names; prefer your current one
  return (
    process.env.ACCESS_TOKEN_SECRET ||
    process.env.JWT_ACCESS_SECRET ||
    process.env.JWT_SECRET
  );
}

export const auth = (req, res, next) => {
  try {
    const header = req.headers.authorization || req.headers.Authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: "Missing Authorization header" });
    }

    const secret = getAccessSecret();
    if (!secret) {
      return res.status(500).json({ success: false, message: "Server misconfigured: missing ACCESS_TOKEN_SECRET" });
    }

    const payload = jwt.verify(token, secret);

    // Normalize the user id so controllers can rely on both
    const userId = payload._id || payload.id || payload.sub;
    req.user = {
      ...payload,
      _id: userId ? String(userId) : undefined,
      id:  userId ? String(userId) : undefined,
    };

    return next();
  } catch (e) {
    const message = e?.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
    return res.status(401).json({ success: false, message });
  }
};

export const requireSuperAdmin = (req, res, next) => {
  if (req.user?.role !== "superadmin") {
    return res.status(403).json({ success: false, message: "Forbidden (superadmin only)" });
  }
  next();
};
