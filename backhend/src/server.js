// src/server.js
import "dotenv/config";
import http from "node:http";
import jwt from "jsonwebtoken";
import { Server as SocketIOServer } from "socket.io";

import connectDB from "./config/db.js";
import app, { SOCKET_CORS as APP_SOCKET_CORS } from "./app.js";

// controllers for persistence
import { createMessage, touchConversation, markRead } from "./controllers/chat.controller.js";
// If you want to enforce membership on join, uncomment the next line and use it below:
// import Conversation from "./models/conversation.js";

/* ---------- Socket CORS ---------- */
const devDefaults = ["http://localhost:5173", "http://127.0.0.1:5173"];
const envList = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const FALLBACK_SOCKET_CORS = { origin: envList.length ? envList : devDefaults, credentials: true };
// Prefer what app.js calculated; otherwise fall back
const SOCKET_CORS = APP_SOCKET_CORS || FALLBACK_SOCKET_CORS;

/* ---------- HTTP + Express ---------- */
const server = http.createServer(app);

// Optional: tune Node's timeouts for long-lived WS connections
server.keepAliveTimeout = 61_000;   // > 60s to outlive common proxies
server.headersTimeout   = 65_000;

/* ---------- Socket.IO ---------- */
const io = new SocketIOServer(server, {
  cors: SOCKET_CORS,
  path: "/socket.io",
  transports: ["websocket"], // dev: skip polling issues
});

// Expose io to routes/controllers if needed
app.set("io", io);

/* ---------- Helper: normalize Bearer tokens ---------- */
function stripBearer(t) {
  if (!t || typeof t !== "string") return t;
  return t.replace(/^Bearer\s+/i, "");
}

/* ---------- Extract accessToken from Cookie header ---------- */
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

/* ---------- Socket auth (JWT) ---------- */
io.use((socket, next) => {
  try {
    const authToken   = stripBearer(socket.handshake.auth?.token);
    const headerToken = stripBearer(socket.handshake.headers?.authorization);
    const cookieToken = readCookieToken(socket.handshake.headers);

    const token = authToken || headerToken || cookieToken;
    if (!token) return next(new Error("No token provided"));

    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    socket.user = { _id: String(payload._id), username: payload.username, email: payload.email };
    return next();
  } catch (err) {
    return next(new Error("Unauthorized"));
  }
});

/* ---------- Room name helper ---------- */
const roomOf = (conversationId) => `conv:${conversationId}`;

/* ---------- Chat events ---------- */
io.on("connection", (socket) => {
  const userId = socket.user?._id;
  if (!userId) {
    socket.disconnect(true);
    return;
  }

  // Personal room (notifications etc.)
  socket.join(`user:${userId}`);

  // Join a conversation room
  socket.on("chat:join", async ({ conversationId }) => {
    try {
      if (!conversationId) return;

      // OPTIONAL: enforce membership
      // const convo = await Conversation.findById(conversationId).select("participants");
      // if (!convo || !convo.participants?.map(String).includes(userId)) return;

      socket.join(roomOf(conversationId));

      // Optional presence broadcast
      socket.to(roomOf(conversationId)).emit("chat:presence", {
        conversationId,
        userId,
        online: true,
      });
    } catch (e) {
      console.error("chat:join error", e);
    }
  });

  socket.on("chat:leave", ({ conversationId }) => {
    if (!conversationId) return;
    socket.leave(roomOf(conversationId));
  });

  // Typing indicator (ephemeral)
  socket.on("chat:typing", ({ conversationId, isTyping }) => {
    if (!conversationId) return;
    socket.to(roomOf(conversationId)).emit("chat:typing", {
      conversationId,
      userId,
      isTyping: !!isTyping,
    });
  });

  // Persist + broadcast messages, with ACK for optimistic UI
  socket.on("chat:message", async (payload, ack) => {
    try {
      const { conversationId, text, attachments } = payload || {};
      if (!conversationId || (!text && !attachments?.length)) return;

      // OPTIONAL: enforce membership (same as in join)
      // const convo = await Conversation.findById(conversationId).select("participants");
      // if (!convo || !convo.participants?.map(String).includes(userId)) {
      //   if (typeof ack === "function") ack({ error: "forbidden" });
      //   return;
      // }

      // 1) Save
      const saved = await createMessage({
        conversationId,
        sender: userId,
        text: text?.trim?.(),
        attachments,
      });

      // 2) Update conversation preview/unread
      await touchConversation(conversationId, saved);

      // 3) Broadcast to room (including sender for consistency)
      io.to(roomOf(conversationId)).emit("chat:message", saved);

      // 4) ACK to sender to reconcile optimistic bubble
      if (typeof ack === "function") ack(saved);
    } catch (err) {
      console.error("chat:message error", err);
      if (typeof ack === "function") ack({ error: "send_failed" });
      socket.emit("chat:error", { message: "Failed to send message" });
    }
  });

  // Read receipts (persist + notify)
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
    } catch (e) {
      console.error("chat:read error", e);
    }
  });

  socket.on("disconnect", () => {
    // optional: presence cleanup
  });
});

/* ---------- Start server after DB ---------- */
const PORT = Number(process.env.PORT || 3000);

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 HTTP + WebSocket server on :${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ Error connecting to database", error);
    process.exit(1);
  });

/* ---------- Graceful shutdown ---------- */
function shutdown(sig) {
  console.log(`${sig} received. Shutting down...`);
  server.close(() => process.exit(0));
}
["SIGINT", "SIGTERM"].forEach((s) => process.on(s, () => shutdown(s)));
