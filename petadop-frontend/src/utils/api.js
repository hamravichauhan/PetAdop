// src/utils/api.js
import axios from "axios";

/**
 * Base URL strategy:
 * - In dev with Vite proxy:   VITE_API_BASE_URL = "/api"
 * - Without proxy (direct):   VITE_API_BASE_URL = "http://127.0.0.1:3000/api"
 *
 * In BOTH cases, always call api with paths like: api.get("/pets"), api.post("/auth/login")
 * i.e., DO NOT prefix with /api in the call sites.
 */
const RAW_BASE = import.meta.env.VITE_API_BASE_URL?.trim();
const BASE =
  !RAW_BASE || RAW_BASE === ""
    ? "/api" // safe default
    : RAW_BASE.endsWith("/")
    ? RAW_BASE.slice(0, -1) // strip trailing slash
    : RAW_BASE;

const api = axios.create({
  baseURL: BASE,          // e.g., "/api" or "http://127.0.0.1:3000/api"
  withCredentials: true,  // OK even if you don't use cookie refresh
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

// bootstrap header on load
const boot = getToken();
if (boot) setToken(boot);

/* ------------- request interceptor ------------- */
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Normalize leading slashes to avoid accidental "//" or "/api/api"
  if (typeof config.url === "string") {
    const isAbsolute = /^https?:\/\//i.test(config.url);
    if (!isAbsolute) {
      config.url = config.url.startsWith("/") ? config.url : `/${config.url}`;
    }
  }
  return config;
});

/* ---------------- helpers for refresh ---------------- */
function isAuthEndpointUrl(fullUrl = "") {
  // Works for relative or absolute URLs
  const u = String(fullUrl).toLowerCase();
  return (
    u.endsWith("/auth/login") ||
    u.endsWith("/auth/register") ||
    u.endsWith("/auth/refresh") ||
    u.endsWith("/auth/logout") ||
    u.endsWith("/auth/password/forgot") ||
    u.endsWith("/auth/password/reset")
  );
}

// If BASE is "/api"           → "/api/auth/refresh"
// If BASE is "http..../api"   → "http..../api/auth/refresh"
function buildRefreshUrl() {
  return `${BASE}/auth/refresh`;
}

/* ------------- response interceptor (401 refresh) ------------- */
let refreshInFlight = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error || {};
    if (!response || !config) return Promise.reject(error);

    // If not a 401, already retried, or an auth endpoint → don't try to refresh
    if (response.status !== 401 || config.__isRetry || isAuthEndpointUrl(config.url)) {
      return Promise.reject(error);
    }

    // Start (or await) a single refresh request
    if (!refreshInFlight) {
      refreshInFlight = (async () => {
        try {
          // IMPORTANT: your backend expects refreshToken in the body (unless cookie mode is on)
          const refreshToken = getRefreshToken();
          const body = refreshToken ? { refreshToken } : {};

          // Use raw axios to avoid recursion through this interceptor
          const refreshRes = await axios.post(buildRefreshUrl(), body, {
            withCredentials: true,
            timeout: 15000,
          });

          const newToken =
            refreshRes.data?.accessToken ||
            refreshRes.data?.token ||
            refreshRes.data?.tokens?.accessToken ||
            null;

          if (!newToken) throw new Error("No access token in refresh response");
          setToken(newToken);
          return newToken;
        } catch (e) {
          setToken(null);
          throw e;
        } finally {
          refreshInFlight = null;
        }
      })();
    }

    try {
      await refreshInFlight; // wait for refresh to complete
      // Retry original request once with fresh token
      const t = getToken();
      config.__isRetry = true;
      config.headers = config.headers || {};
      if (t) config.headers.Authorization = `Bearer ${t}`;

      // Keep original URL (absolute or relative)
      return api(config);
    } catch {
      // Refresh failed → propagate original error
      return Promise.reject(error);
    }
  }
);

export default api;
