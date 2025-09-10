// src/utils/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:3000",
  withCredentials: true, // OK even if you don't use cookie refresh
});

/* ---------------- helpers ---------------- */
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
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ------------- response interceptor (401 refresh) ------------- */
let refreshInFlight = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error || {};
    if (!response) return Promise.reject(error);

    // Avoid refresh loops on auth endpoints
    const url = (config?.url || "").toLowerCase();
    const isAuthEndpoint =
      url.endsWith("/api/auth/login") ||
      url.endsWith("/api/auth/register") ||
      url.endsWith("/api/auth/refresh") ||
      url.endsWith("/api/auth/logout");

    // If not a 401, already retried, or an auth endpoint → just fail
    if (response.status !== 401 || config.__isRetry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    // Start (or await) a single refresh request
    if (!refreshInFlight) {
      refreshInFlight = (async () => {
        try {
          const refreshRes = await axios.post(
            `${api.defaults.baseURL}/api/auth/refresh`,
            {},
            { withCredentials: true }
          );
          const newToken =
            refreshRes.data?.accessToken ||
            refreshRes.data?.token ||
            refreshRes.data?.tokens?.accessToken ||
            null;

          if (!newToken) throw new Error("No token in refresh response");
          setToken(newToken);
          return newToken;
        } catch (e) {
          setToken(null);
          throw e;
        } finally {
          // IMPORTANT: do not return anything here (prevents promise chain cycles)
          refreshInFlight = null;
        }
      })();
    }

    try {
      await refreshInFlight; // wait for refresh result
      // Retry original request once with fresh token
      config.__isRetry = true;
      const t = getToken();
      if (t) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${t}`;
      }
      return api(config);
    } catch {
      // Refresh failed → propagate original error
      return Promise.reject(error);
    }
  }
);

export default api;
