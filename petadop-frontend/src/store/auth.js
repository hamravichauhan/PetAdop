// src/store/auth.js
import { create } from "zustand";
import api from "../utils/api.js";

/**
 * Small helpers to keep token & Authorization header in sync
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
      const { data } = await api.get("/api/users/me");
      const user = data?.user ?? data ?? null;
      set({ user, isAuthed: !!user });
    } catch {
      // invalid/expired token
      setToken(null);
      set({ user: null, isAuthed: false });
    } finally {
      set({ loadingMe: false });
    }
  },

  /**
   * Login with email OR username
   * Auto-logs in by storing token + user
   */
  async login({ identifier, password }) {
    try {
      const body = identifier?.includes("@")
        ? { email: identifier.trim(), password }
        : { username: identifier.trim(), password };

      const { data } = await api.post("/api/auth/login", body);

      // Accept either accessToken or token (compat)
      const token =
        data?.accessToken ||
        data?.token ||
        data?.tokens?.accessToken ||
        null;

      if (token) setToken(token);

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
      return { ok: false, error: msg };
    }
  },

  /**
   * Register and auto-login
   */
  async register(payload) {
    try {
      const { data } = await api.post("/api/auth/register", payload);

      const token =
        data?.accessToken ||
        data?.token ||
        data?.tokens?.accessToken ||
        null;

      if (token) setToken(token);

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
      return { ok: false, error: msg };
    }
  },

  /**
   * Optional: refresh access token if backend exposes /auth/refresh
   * Works for either body-token or cookie-based refresh (cookie preferred).
   */
  async refresh() {
    try {
      const { data } = await api.post("/api/auth/refresh", {});
      const newToken =
        data?.accessToken ||
        data?.token ||
        data?.tokens?.accessToken ||
        null;
      if (newToken) {
        setToken(newToken);
        // keep user as-is; /users/me will be called on demand
        set({ isAuthed: true });
        return { ok: true };
      }
      return { ok: false, error: "No token in refresh response" };
    } catch (e) {
      // refresh failed; clean up session
      setToken(null);
      set({ user: null, isAuthed: false });
      return { ok: false, error: "Refresh failed" };
    }
  },

  /**
   * Logout: clear local session and best-effort server cookie clear
   */
  async logout() {
    try {
      // If backend uses cookie for refresh, this clears it
      await api.post("/api/auth/logout");
    } catch {
      // ignore network errors here
    } finally {
      setToken(null);
      set({ user: null, isAuthed: false });
    }
  },
}));
