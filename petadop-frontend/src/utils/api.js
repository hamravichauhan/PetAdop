// src/utils/api.js
import axios from "axios";

/**
 * Base URL strategy:
 * - Dev with Vite proxy:  VITE_API_BASE_URL = "/api"
 * - Direct to server:     VITE_API_BASE_URL = "http://127.0.0.1:3000/api"
 *
 * Always call like: api.get("/pets"), api.post("/auth/login"), etc.
 */
const RAW_BASE = (import.meta.env.VITE_API_BASE_URL || "").trim();
const BASE =
  RAW_BASE === ""
    ? "/api"
    : RAW_BASE.endsWith("/")
    ? RAW_BASE.slice(0, -1)
    : RAW_BASE;

// Axios instance for app API calls
const api = axios.create({
  baseURL: BASE,         // "/api" or "http://.../api"
  withCredentials: true, // allows cookie-based auth if you use it
  timeout: 20000,
});

/* ---------------- token helpers ---------------- */
function getToken() {
  return localStorage.getItem("token");
}
function setToken(t) {
  if (t) {
    localStorage.setItem("token", t);
    api.defaults.headers.common.Authorization = `Bearer ${t}`;
  } else {
    localStorage.removeItem("token");
    delete api.defaults.headers.common.Authorization;
  }
}
function getRefreshToken() {
  return localStorage.getItem("refreshToken");
}
function setRefreshToken(rt) {
  if (rt) localStorage.setItem("refreshToken", rt);
  else localStorage.removeItem("refreshToken");
}

// bootstrap header on load
const boot = getToken();
if (boot) setToken(boot);

/* ------------- small URL utilities ------------- */
function toAbsoluteUrlMaybe(u) {
  // If u is absolute, return as is; if relative, resolve against current origin
  try {
    const isAbs = /^https?:\/\//i.test(u);
    return isAbs ? u : new URL(u, window.location.origin).toString();
  } catch {
    return u; // fallback, shouldn't happen
  }
}

function cleanRelativeUrl(u) {
  // Ensure a single leading slash for relative URLs (not affecting absolute URLs)
  if (typeof u !== "string") return u;
  if (/^https?:\/\//i.test(u)) return u; // absolute: leave as-is
  return u.startsWith("/") ? u : `/${u}`;
}

/* ------------- request interceptor ------------- */
api.interceptors.request.use((config) => {
  // Attach bearer if present
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Normalize the path if it's relative (avoid "//" or double "/api")
  if (typeof config.url === "string") {
    config.url = cleanRelativeUrl(config.url);
  }
  return config;
});

/* ------------- helpers for refresh ------------- */
function pathnameOf(urlLike) {
  try {
    // Works for both absolute and relative URLs
    const u = new URL(urlLike, window.location.origin);
    return u.pathname.toLowerCase();
  } catch {
    // Best effort fallback
    return String(urlLike || "").toLowerCase();
  }
}

function isAuthEndpointUrl(urlLike) {
  const p = pathnameOf(urlLike);
  return (
    p.endsWith("/auth/login") ||
    p.endsWith("/auth/register") ||
    p.endsWith("/auth/refresh") ||
    p.endsWith("/auth/logout") ||
    p.endsWith("/auth/password/forgot") ||
    p.endsWith("/auth/password/reset")
  );
}

function buildRefreshUrl() {
  // BASE may be relative or absolute; resolve properly
  // We want "<BASE>/auth/refresh" without double slashes.
  const base = BASE.endsWith("/") ? BASE.slice(0, -1) : BASE;
  const rel = "/auth/refresh";
  const full = `${base}${rel}`;
  return toAbsoluteUrlMaybe(full);
}

/* ------------- response interceptor (401 -> refresh) ------------- */
let refreshInFlight = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error || {};
    if (!response || !config) return Promise.reject(error);

    // If not a 401, already retried, or it's an auth endpoint → do not refresh
    if (response.status !== 401 || config.__isRetry || isAuthEndpointUrl(config.url)) {
      return Promise.reject(error);
    }

    // Start (or piggyback on) a single refresh request
    if (!refreshInFlight) {
      refreshInFlight = (async () => {
        try {
          // If you use cookie-based refresh, body can be {}.
          // If you store refresh token client-side, send it in the body.
          const refreshToken = getRefreshToken();
          const body = refreshToken ? { refreshToken } : {};

          // Use raw axios to avoid this interceptor recursion
          const refreshRes = await axios.post(buildRefreshUrl(), body, {
            withCredentials: true,
            timeout: 15000,
          });

          // Accept common shapes
          const newAccess =
            refreshRes.data?.accessToken ||
            refreshRes.data?.token ||
            refreshRes.data?.tokens?.accessToken ||
            null;

          const newRefresh =
            refreshRes.data?.refreshToken ||
            refreshRes.data?.tokens?.refreshToken ||
            null;

          if (!newAccess) throw new Error("No access token in refresh response");

          setToken(newAccess);
          if (newRefresh) setRefreshToken(newRefresh);

          return newAccess;
        } catch (e) {
          // Refresh failed → clear tokens
          setToken(null);
          setRefreshToken(null);
          throw e;
        } finally {
          refreshInFlight = null;
        }
      })();
    }

    try {
      await refreshInFlight; // wait for refreshed token
      // Retry the original request once
      const t = getToken();
      config.__isRetry = true;
      config.headers = config.headers || {};
      if (t) config.headers.Authorization = `Bearer ${t}`;

      // Keep original absolute/relative URL exactly as it was
      return api(config);
    } catch {
      // Propagate original error if refresh failed
      return Promise.reject(error);
    }
  }
);

/* ------------- optional exports for your store ------------- */
/**
 * Use after login:
 *   setAuthTokens({ accessToken, refreshToken })
 * or
 *   setAuthTokens({ token })
 */
export function setAuthTokens({ accessToken, token, refreshToken } = {}) {
  setToken(accessToken || token || null);
  if (typeof refreshToken !== "undefined") setRefreshToken(refreshToken);
}

/** Use on logout */
export function clearAuthTokens() {
  setToken(null);
  setRefreshToken(null);
}

export default api;
