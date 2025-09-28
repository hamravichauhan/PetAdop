// src/store/auth.js
import { create } from "zustand";
import api from "../utils/api.js";

/**
 * Token helpers: keep Authorization header and localStorage in sync
 */
function setToken(token) {
  if (token) {
    localStorage.setItem("token", token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem("token");
    delete api.defaults.headers.common.Authorization;
  }
}

function getToken() {
  return localStorage.getItem("token");
}

function setRefreshToken(rt) {
  if (rt) localStorage.setItem("refreshToken", rt);
  else localStorage.removeItem("refreshToken");
}
function getRefreshToken() {
  return localStorage.getItem("refreshToken");
}

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthed: false,
  loadingMe: false,

  /**
   * Restore session if a token exists.
   * Ensures axios has Authorization header before calling /users/me
   */
  async loadMe() {
    const token = getToken();
    if (!token) return;
    try {
      set({ loadingMe: true });
      setToken(token); // ensure header is set
      const { data } = await api.get("/users/me");
      // backend returns { success: true, data: {...} }
      const user = data?.data ?? data?.user ?? null;
      set({ user, isAuthed: !!user });
    } catch {
      // invalid/expired token
      setToken(null);
      setRefreshToken(null);
      set({ user: null, isAuthed: false });
    } finally {
      set({ loadingMe: false });
    }
  },

  /**
   * Login with email OR username (both supported)
   *  - If called as login({ email, password })
   *  - Or login({ identifier, password })
   * Auto-logs in by storing token + user
   */
  async login(creds) {
    try {
      let body;
      if (creds?.email) {
        body = { email: String(creds.email).trim().toLowerCase(), password: creds.password };
      } else if (creds?.identifier) {
        const id = String(creds.identifier).trim();
        body = id.includes("@") ? { email: id.toLowerCase(), password: creds.password }
                                : { username: id, password: creds.password };
      } else {
        throw new Error("Missing credentials");
      }

      const { data } = await api.post("/auth/login", body);

      // Accept either accessToken or token (compat)
      const token =
        data?.accessToken ||
        data?.token ||
        data?.tokens?.accessToken ||
        null;

      const refreshToken = data?.tokens?.refreshToken || null;

      if (token) setToken(token);
      if (refreshToken) setRefreshToken(refreshToken);

      const user = data?.user ?? null;
      if (user) {
        set({ user, isAuthed: true });
      } else {
        await get().loadMe();
      }
      return { ok: true, user: user ?? null };
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Login failed";
      console.warn("login error:", msg);
      return { ok: false, error: msg, message: msg };
    }
  },

  /**
   * Register and auto-login
   * backend expects: fullname, username, email, contactPhone, password, [avatar]
   */
  async register(payload) {
    try {
      const { data } = await api.post("/auth/register", payload);

      const token =
        data?.accessToken ||
        data?.token ||
        data?.tokens?.accessToken ||
        null;

      const refreshToken = data?.tokens?.refreshToken || null;

      if (token) setToken(token);
      if (refreshToken) setRefreshToken(refreshToken);

      const user = data?.user ?? null;
      if (user) {
        set({ user, isAuthed: true });
      } else {
        await get().loadMe();
      }
      return { ok: true, user: user ?? null };
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Registration failed";
      console.warn("register error:", msg);
      return { ok: false, error: msg, message: msg };
    }
  },

  /**
   * Refresh access token (body-mode with refreshToken, per your backend)
   */
  async refresh() {
    try {
      const refreshToken = getRefreshToken();
      const body = refreshToken ? { refreshToken } : {};
      const { data } = await api.post("/auth/refresh", body);

      const newToken =
        data?.accessToken ||
        data?.token ||
        data?.tokens?.accessToken ||
        null;

      if (newToken) {
        setToken(newToken);
        set({ isAuthed: true });
        return { ok: true };
      }
      return { ok: false, error: "No token in refresh response" };
    } catch (e) {
      // refresh failed; clean up session
      setToken(null);
      setRefreshToken(null);
      set({ user: null, isAuthed: false });
      return { ok: false, error: "Refresh failed" };
    }
  },

  /**
   * Logout: clear local session and best-effort server cookie clear
   */
  async logout() {
    try {
      await api.post("/auth/logout"); // clears cookie mode if used
    } catch {
      // ignore network errors here
    } finally {
      setToken(null);
      setRefreshToken(null);
      set({ user: null, isAuthed: false });
    }
  },

  /**
   * Forgot password (privacy-safe)
   */
  async forgotPassword(email) {
    try {
      await api.post("/auth/password/forgot", { email });
      return { ok: true };
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Request failed";
      return { ok: false, message: msg, error: msg };
    }
  },

  /**
   * Reset password using token
   */
  async resetPassword({ token, password }) {
    try {
      const { data } = await api.post("/auth/password/reset", { token, password });
      return { ok: !!data?.success };
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Reset failed";
      return { ok: false, message: msg, error: msg };
    }
  },
}));
