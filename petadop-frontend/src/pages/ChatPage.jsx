// src/pages/ChatPage.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../utils/api";
import socket, { refreshSocketAuth } from "../lib/socket";
import {
  ArrowLeft,
  Send,
  Image,
  Smile,
  Paperclip,
  Phone,
  VideoIcon,
  MoreVertical,
} from "lucide-react";

export default function ChatPage() {
  const { id: conversationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [token, setToken] = useState(
    () => localStorage.getItem("token") || null
  );

  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  // typing state
  const [typing, setTyping] = useState(false);
  const [theyTyping, setTheyTyping] = useState(false);
  const typingTimer = useRef(null);
  const theyTypingTimer = useRef(null);

  // read receipts state
  const [seenAt, setSeenAt] = useState(null);

  /* ---------- ensure we have a token BEFORE connecting socket ---------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      let t = localStorage.getItem("token");
      if (!t) {
        try {
          const r = await api.post(
            "/auth/refresh",
            {},
            { withCredentials: true }
          );
          const newT =
            r.data?.accessToken ||
            r.data?.token ||
            r.data?.tokens?.accessToken ||
            null;
          if (newT) {
            localStorage.setItem("token", newT);
            t = newT;
          }
        } catch {}
      }
      if (!alive) return;
      if (!t) {
        const redir = encodeURIComponent(location.pathname + location.search);
        navigate(`/login?redirect=${redir}`);
        return;
      }
      setToken(t);
    })();
    return () => {
      alive = false;
    };
  }, [navigate, location.pathname, location.search]);

  /* ---------- my user id from JWT ---------- */
  const myId = useMemo(() => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload?._id || payload?.id || null;
    } catch {
      return null;
    }
  }, [token]);

  /* ---------- load conversation details (graceful) + history ---------- */
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    if (!conversationId) {
      setError("No conversation ID provided");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const [messagesRes, convoRes] = await Promise.all([
          api.get(`/chat/${conversationId}/messages`),
          api.get(`/chat/${conversationId}`).catch(() => null), // tolerate if not implemented
        ]);
        if (!alive) return;

        if (messagesRes?.data?.success)
          setMessages(messagesRes.data.data || []);
        else setError("Failed to load messages");

        if (convoRes?.data?.success)
          setConversation(convoRes.data.data || null);
        else setConversation(null);
      } catch (e) {
        console.error(
          "Load failed",
          e?.response?.status,
          e?.response?.data || e.message
        );
        setError(
          e?.response?.status === 404
            ? "Conversation not found"
            : "Failed to load chat"
        );
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [conversationId]);

  /* ---------- detect self-chat (disable sending) ---------- */
  const isSelfChat = useMemo(() => {
    if (!myId) return false;
    const participants = conversation?.participants || [];
    const ids = participants
      .map((p) => (typeof p === "string" ? p : p?._id))
      .filter(Boolean);
    if (ids.length) return ids.length === 1 && ids[0] === myId;

    // fallback from messages
    if (messages.length) {
      const senders = new Set(
        messages.map((m) => m?.sender?._id || m?.sender).filter(Boolean)
      );
      const recips = new Set(
        messages.map((m) => m?.recipient?._id || m?.recipient).filter(Boolean)
      );
      const all = new Set([...senders, ...recips]);
      return all.size === 1 && all.has(myId);
    }
    return false;
  }, [conversation, messages, myId]);

  /* ---------- other participant (with fallback) ---------- */
  const otherParticipant = useMemo(() => {
    if (conversation && myId) {
      const arr = conversation.participants || [];
      const found = arr.find(
        (p) => (typeof p === "string" ? p : p?._id) !== myId
      );
      if (found)
        return typeof found === "string"
          ? { _id: found, username: "User" }
          : found;
    }
    // fallback from messages: pick the last message's other side
    if (messages.length && myId) {
      const last = messages[messages.length - 1];
      const sid = last?.sender?._id || last?.sender;
      if (sid && sid !== myId)
        return last?.sender || { _id: sid, username: "User" };
      const rid = last?.recipient?._id || last?.recipient;
      if (rid && rid !== myId)
        return last?.recipient || { _id: rid, username: "User" };
    }
    return null;
  }, [conversation, messages, myId]);

  /* ---------- socket: authenticate, join, listen ---------- */
  useEffect(() => {
    if (!conversationId || !token) return;

    refreshSocketAuth(token); // RAW JWT in auth.token

    const joinPayload = { conversationId };
    const joinIfConnected = () => {
      if (socket.connected) socket.emit("chat:join", joinPayload);
    };

    joinIfConnected();

    const onConnect = () => joinIfConnected();
    const onReconnect = () => joinIfConnected();

    const onMsg = (msg) => {
      const cid = msg?.conversation || msg?.conversationId;
      if (cid === conversationId) setMessages((prev) => [...prev, msg]);
    };

    const onTyping = (data) => {
      if (data?.conversationId !== conversationId) return;
      if (data?.userId === myId) return;
      // use server's isTyping flag
      const active = !!data?.isTyping;
      setTheyTyping(active);
      clearTimeout(theyTypingTimer.current);
      if (active) {
        theyTypingTimer.current = setTimeout(() => setTheyTyping(false), 1500);
      }
    };

    const onRead = ({ conversationId: cid, userId: who, at }) => {
      if (cid !== conversationId || who === myId) return;
      if (at) setSeenAt(at);
    };

    const onErr = (err) => console.error("socket error:", err);

    socket.on("connect", onConnect);
    socket.on("reconnect", onReconnect);
    socket.on("chat:message", onMsg);
    socket.on("chat:typing", onTyping);
    socket.on("chat:read", onRead);
    socket.on("connect_error", onErr);

    return () => {
      socket.off("connect", onConnect);
      socket.off("reconnect", onReconnect);
      socket.off("chat:message", onMsg);
      socket.off("chat:typing", onTyping);
      socket.off("chat:read", onRead);
      socket.off("connect_error", onErr);
      socket.emit("chat:leave", joinPayload);
      clearTimeout(theyTypingTimer.current);
    };
  }, [conversationId, token, myId]);

  /* ---------- mark read when new incoming message arrives ---------- */
  useEffect(() => {
    if (!messages.length || !socket.connected) return;
    const last = messages[messages.length - 1];
    const fromMe = myId && (last?.sender?._id || last?.sender) === myId;
    if (fromMe) return;

    const at = last.createdAt || last.timestamp || new Date().toISOString();
    api.post(`/chat/${conversationId}/read`, { at }).catch(() => {});
    socket.emit("chat:read", { conversationId, at });
  }, [messages, conversationId, myId]);

  /* ---------- autoscroll ---------- */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, theyTyping]);

  /* ---------- send message ---------- */
  const sendMessage = () => {
    const textTrim = text.trim();
    if (!textTrim || isSelfChat || !socket.connected) return;

    // server broadcasts back (and to others)
    socket.emit("chat:message", {
      conversationId,
      text: textTrim,
      timestamp: new Date().toISOString(),
    });

    setText("");
    setTyping(false);
    socket.emit("chat:typing", { conversationId, isTyping: false }); // <-- fixed key
  };

  /* ---------- handle typing indicator (debounced) ---------- */
  const handleTyping = () => {
    if (!socket.connected || isSelfChat) return;
    if (!typing) {
      setTyping(true);
      socket.emit("chat:typing", { conversationId, isTyping: true }); // <-- fixed key
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setTyping(false);
      socket.emit("chat:typing", { conversationId, isTyping: false }); // <-- fixed key
    }, 1000);
  };

  /* ---------- handle file upload (placeholder) ---------- */
  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    console.log("Files selected:", files);
    e.target.value = "";
  };

  /* ---------- UI ---------- */
  if (loading) {
    return (
      <div className="flex h-screen flex-col bg-gradient-to-b from-pink-50 to-white">
        <div className="flex h-20 items-center border-b border-pink-200 bg-white px-4">
          <div className="h-8 w-8 animate-pulse rounded-full bg-pink-200" />
          <div className="ml-3">
            <div className="h-4 w-32 animate-pulse rounded bg-pink-200" />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-pink-600">Loading chat…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gradient-to-b from-pink-50 to-white">
        <div className="rounded-2xl bg-white p-8 shadow-md text-center">
          <div className="text-red-500 text-lg mb-2">Error</div>
          <div className="text-pink-700 mb-4">{error}</div>
          <button
            onClick={() => navigate(-1)}
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-xl"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // compute "Seen" under last message I sent
  const lastMineIndex = [...messages]
    .map((m, i) => ({
      i,
      fromMe: myId && (m?.sender?._id === myId || m?.sender === myId),
      at: m?.createdAt || m?.timestamp,
    }))
    .filter((x) => x.fromMe)
    .map((x) => x.i)
    .pop();

  return (
    <div className="flex h-screen flex-col bg-gradient-to-b from-pink-50 to-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-pink-200 bg-white px-4 py-3">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-3 text-pink-600 hover:text-pink-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          {otherParticipant ? (
            <div className="flex items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-pink-400 to-rose-400 text-white font-semibold">
                {otherParticipant.username?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="ml-3">
                <div className="font-semibold text-pink-800">
                  {otherParticipant.username || "Unknown User"}
                </div>
                {theyTyping ? (
                  <div className="text-xs text-pink-500">typing...</div>
                ) : (
                  <div className="text-xs text-pink-500">Online</div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-pink-800 font-semibold">Unknown User</div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-pink-600 hover:text-pink-700 rounded-full hover:bg-pink-100">
            <Phone className="h-5 w-5" />
          </button>
          <button className="p-2 text-pink-600 hover:text-pink-700 rounded-full hover:bg-pink-100">
            <VideoIcon className="h-5 w-5" />
          </button>
          <button className="p-2 text-pink-600 hover:text-pink-700 rounded-full hover:bg-pink-100">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-pink-600">
              <div className="text-2xl mb-2">👋</div>
              <div className="font-medium">No messages yet</div>
              <div className="text-sm">Start the conversation!</div>
            </div>
          </div>
        ) : (
          messages.map((m, idx) => {
            const fromMe =
              myId && (m?.sender?._id === myId || m?.sender === myId);
            const when = new Date(m?.createdAt || m?.timestamp || Date.now());
            const timeStr = when.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            const showSeen =
              typeof lastMineIndex === "number" &&
              idx === lastMineIndex &&
              seenAt &&
              new Date(seenAt) >= when;

            return (
              <div
                key={
                  m._id ||
                  `${when.getTime()}-${Math.random().toString(36).slice(2)}`
                }
              >
                <div
                  className={`flex ${fromMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs rounded-2xl px-4 py-3 ${
                      fromMe
                        ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-br-md"
                        : "bg-white text-gray-800 border border-pink-100 rounded-bl-md shadow-sm"
                    }`}
                    title={when.toLocaleString()}
                  >
                    <div className="text-sm">{m.text}</div>
                    <div
                      className={`text-xs mt-1 ${
                        fromMe ? "text-pink-100" : "text-pink-500"
                      }`}
                    >
                      {timeStr}
                    </div>
                  </div>
                </div>
                {showSeen && (
                  <div className="mt-0.5 text-right text-[11px] text-gray-500">
                    Seen
                  </div>
                )}
              </div>
            );
          })
        )}

        {theyTyping && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl px-4 py-3 border border-pink-100">
              <div className="flex space-x-1">
                <div className="h-2 w-2 bg-pink-400 rounded-full animate-bounce"></div>
                <div
                  className="h-2 w-2 bg-pink-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="h-2 w-2 bg-pink-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-pink-200 bg-white p-3">
        {isSelfChat && (
          <div className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            You can't message yourself. This conversation is read-only.
          </div>
        )}
        {!socket.connected && (
          <div className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            Connection lost. Trying to reconnect…
          </div>
        )}

        <div className="flex items-center">
          <div className="flex space-x-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-pink-500 hover:text-pink-600 rounded-full hover:bg-pink-100"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <button className="p-2 text-pink-500 hover:text-pink-600 rounded-full hover:bg-pink-100">
              <Image className="h-5 w-5" />
            </button>
            <button className="p-2 text-pink-500 hover:text-pink-600 rounded-full hover:bg-pink-100">
              <Smile className="h-5 w-5" />
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            multiple
          />

          <input
            className="flex-1 mx-2 rounded-full border border-pink-200 px-4 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              handleTyping();
            }}
            placeholder={
              isSelfChat
                ? "You can't send messages to yourself"
                : !socket.connected
                ? "Reconnecting…"
                : "Type a message…"
            }
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={isSelfChat || !socket.connected}
            onBlur={() => {
              clearTimeout(typingTimer.current);
              if (typing) {
                setTyping(false);
                socket.emit("chat:typing", { conversationId, isTyping: false });
              }
            }}
          />

          <button
            onClick={sendMessage}
            disabled={isSelfChat || !text.trim() || !socket.connected}
            className="p-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-pink-600 hover:to-rose-600 transition-all"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
