// src/lib/socket.js
import { io } from "socket.io-client";

/** Dev (proxy): VITE_SOCKET_URL = "/"
 *  Direct:      VITE_SOCKET_URL = "http://127.0.0.1:3000"
 */
const SOCKET_BASE = (import.meta.env.VITE_SOCKET_URL || "/").trim();

function getToken() {
  return localStorage.getItem("token");
}

const socket = io(SOCKET_BASE, {
  path: "/socket.io",
  withCredentials: true,
  transports: ["websocket"],   // ok for dev
  autoConnect: false,          // connect only after setting auth
});

/** Connect using the latest token from storage (RAW JWT, not "Bearer ..."). */
export function connectSocket() {
  const t = getToken();
  socket.auth = t ? { token: t } : {};
  if (!socket.connected) socket.connect();
}

/** Call after login/logout to rotate JWT and reconnect. */
export function refreshSocketAuth(newToken) {
  if (newToken) localStorage.setItem("token", newToken);
  else localStorage.removeItem("token");

  socket.auth = newToken ? { token: newToken } : {};
  if (socket.connected) socket.disconnect();
  socket.connect();
}

/** Optional: force a clean reconnect. */
export function forceReconnect() {
  if (socket.connected) socket.disconnect();
  connectSocket();
}

/* ------------------- Diagnostics ------------------- */
socket.on("connect", () => {
  console.log("[socket] connected", socket.id);
});
socket.on("disconnect", (reason) => {
  console.warn("[socket] disconnected:", reason);
});
socket.on("connect_error", (err) => {
  console.error("[socket] connect_error:", err?.message, err);
});
socket.on("error", (err) => {
  console.error("[socket] error:", err);
});

export default socket;
