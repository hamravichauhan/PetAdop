// src/server.js
import "dotenv/config";
import http from "node:http";
import jwt from "jsonwebtoken";
import { Server as SocketIOServer } from "socket.io";

import connectDB from "./config/db.js";
import app, { SOCKET_CORS as APP_SOCKET_CORS } from "./app.js";

// chat persistence
// import {
//   createMessage,
//   touchConversation,
//   markRead,
// } from "./controllers/chat.controller.js";
// import Conversation from "./models/conversation.js"; // if you want membership enforcement

/* ---------- Socket CORS ---------- */
const devDefaults = ["http://localhost:5173", "http://127.0.0.1:5173"];
const envList = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const FALLBACK_SOCKET_CORS = {
  origin: envList.length ? envList : devDefaults,
  credentials: true,
};

const SOCKET_CORS = APP_SOCKET_CORS || FALLBACK_SOCKET_CORS;

/* ---------- HTTP + Express ---------- */
const server = http.createServer(app);
server.keepAliveTimeout = 61_000; // keep-alive > 60s (proxy safe)
server.headersTimeout = 65_000;

/* ---------- Socket.IO ---------- */
const io = new SocketIOServer(server, {
  cors: SOCKET_CORS,
  path: "/socket.io",
  transports: ["websocket"], // dev: skip polling
});

// expose io globally to app if needed
app.set("io", io);

/* ---------- Helpers ---------- */
function stripBearer(token) {
  if (!token || typeof token !== "string") return token;
  return token.replace(/^Bearer\s+/i, "");
}

function readCookieToken(headers) {
  const raw = headers?.cookie || "";
  const m = raw.match(/(?:^|;\s*)accessToken=([^;]+)/);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

/* ---------- Socket Auth ---------- */
io.use((socket, next) => {
  try {
    const authToken = stripBearer(socket.handshake.auth?.token);
    const headerToken = stripBearer(socket.handshake.headers?.authorization);
    const cookieToken = readCookieToken(socket.handshake.headers);

    const token = authToken || headerToken || cookieToken;
    if (!token) return next(new Error("No token provided"));

    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    socket.user = {
      _id: String(payload._id),
      username: payload.username,
      email: payload.email,
    };
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

/* ---------- Room Helper ---------- */
const roomOf = (conversationId) => `conv:${conversationId}`;

/* ---------- Chat Events ---------- */
io.on("connection", (socket) => {
  const userId = socket.user?._id;
  if (!userId) return socket.disconnect(true);

  // personal room for notifications
  socket.join(`user:${userId}`);

  socket.on("chat:join", async ({ conversationId }) => {
    if (!conversationId) return;
    // (optional) check membership here
    socket.join(roomOf(conversationId));
    socket.to(roomOf(conversationId)).emit("chat:presence", {
      conversationId,
      userId,
      online: true,
    });
  });

  socket.on("chat:leave", ({ conversationId }) => {
    if (conversationId) socket.leave(roomOf(conversationId));
  });

  socket.on("chat:typing", ({ conversationId, isTyping }) => {
    if (!conversationId) return;
    socket.to(roomOf(conversationId)).emit("chat:typing", {
      conversationId,
      userId,
      isTyping: !!isTyping,
    });
  });

  socket.on("chat:message", async (payload, ack) => {
    try {
      const { conversationId, text, attachments } = payload || {};
      if (!conversationId || (!text && !attachments?.length)) return;

      const saved = await createMessage({
        conversationId,
        sender: userId,
        text: text?.trim?.(),
        attachments,
      });

      await touchConversation(conversationId, saved);
      io.to(roomOf(conversationId)).emit("chat:message", saved);

      if (typeof ack === "function") ack(saved);
    } catch (err) {
      console.error("chat:message error", err);
      if (typeof ack === "function") ack({ error: "send_failed" });
      socket.emit("chat:error", { message: "Failed to send message" });
    }
  });

  socket.on("chat:read", async ({ conversationId, at }) => {
    try {
      if (!conversationId) return;
      const readAt = at ? new Date(at) : new Date();

      if (typeof markRead === "function") {
        await markRead(conversationId, userId, readAt);
      }

      socket.to(roomOf(conversationId)).emit("chat:read", {
        conversationId,
        userId,
        at: readAt.toISOString(),
      });
    } catch (err) {
      console.error("chat:read error", err);
    }
  });
});

/* ---------- Start Server ---------- */
const PORT = Number(process.env.PORT || 3000);

connectDB()
  .then(() => {
    server.listen(PORT, () =>
      console.log(`🚀 HTTP + WebSocket server on :${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ Error connecting to database", err);
    process.exit(1);
  });

/* ---------- Graceful Shutdown ---------- */
function shutdown(sig) {
  console.log(`${sig} received. Shutting down...`);
  server.close(() => process.exit(0));
}
["SIGINT", "SIGTERM"].forEach((s) => process.on(s, () => shutdown(s)));

export default server;
