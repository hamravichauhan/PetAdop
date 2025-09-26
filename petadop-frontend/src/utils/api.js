// src/utils/api.js
import axios from "axios";

/**
 * Base URL strategy:
 * - In dev with Vite proxy:   VITE_API_BASE_URL = "/api"
 * - Without proxy (direct):   VITE_API_BASE_URL = "http://127.0.0.1:3000/api"
 *
 * In BOTH cases, always call api with paths like: api.get("/pets"), api.post("/chat/start")
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
  baseURL: BASE,                // e.g., "/api" or "http://127.0.0.1:3000/api"
  withCredentials: true,        // OK even if you don't use cookie refresh
  timeout: 20000,               // sane default
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
    // If using an absolute URL for a one-off request, leave it as-is.
    const isAbsolute = /^https?:\/\//i.test(config.url);
    if (!isAbsolute) {
      // Ensure single leading slash only
      config.url = config.url.startsWith("/") ? config.url : `/${config.url}`;
    }
  }
  return config;
});

/* ------------- response interceptor (401 refresh) ------------- */
let refreshInFlight = null;

// Build a refresh URL that works for BOTH base styles
// If BASE is "/api"  → refreshUrl = "/auth/refresh"
// If BASE is "http://..../api" → refreshUrl = "http://..../auth/refresh"
function buildRefreshUrl() {
  return `${BASE}/auth/refresh`;
}

// Keep auth endpoints detection independent of BASE to avoid mismatch.
// We check the request path tail only, so it works for both "/api/..." and "http://.../api/..."
function isAuthEndpointUrl(fullUrl = "") {
  const u = fullUrl.toLowerCase();
  return (
    u.endsWith("/auth/login") ||
    u.endsWith("/auth/register") ||
    u.endsWith("/auth/refresh") ||
    u.endsWith("/auth/logout") ||
    // ✅ include password routes so refresh interceptor doesn't loop on them
    u.endsWith("/auth/password/forgot") ||
    u.endsWith("/auth/password/reset")
  );
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error || {};
    if (!response || !config) return Promise.reject(error);

    // If not a 401, already retried, or an auth endpoint → just fail
    if (response.status !== 401 || config.__isRetry || isAuthEndpointUrl(config.url)) {
      return Promise.reject(error);
    }

    // Start (or await) a single refresh request
    if (!refreshInFlight) {
      refreshInFlight = (async () => {
        try {
          // Use a *raw* axios call so we don't recurse through this interceptor
          const refreshRes = await axios.post(
            buildRefreshUrl(),
            {},
            { withCredentials: true, timeout: 15000 }
          );
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

      // If config.url was relative, keep it; if absolute, leave it.
      return api(config);
    } catch {
      // Refresh failed → propagate original error
      return Promise.reject(error);
    }
  }
);

export default api;
