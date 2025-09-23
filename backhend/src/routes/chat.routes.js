import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { Conversation } from "../models/conversation.js";
import { Message } from "../models/Message.js";
import {
  createOrGetConversation,
  createMessage,
  touchConversation,
  markRead,
} from "../controllers/chat.controller.js";

const r = Router();

/**
 * GET /chat
 * List my conversations (most recent first)
 */
r.get("/", auth, async (req, res, next) => {
  try {
    const me = req.user._id;
    const convos = await Conversation.find({ participants: me })
      .sort({ updatedAt: -1 })
      .limit(50);
    res.json({ success: true, data: convos });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /chat/start
 * Body: { partnerId, petId }
 * Creates (or returns existing) conversation between me and partner for a pet
 */
r.post("/start", auth, async (req, res, next) => {
  try {
    const me = req.user._id;
    const { partnerId, petId } = req.body || {};
    if (!partnerId) return res.status(400).json({ success: false, message: "partnerId required" });
    const convo = await createOrGetConversation(me, partnerId, petId);
    res.json({ success: true, data: convo });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /chat/:id/messages?before=<ISO>
 * Fetch messages (cursor by createdAt, newest first then reversed for UI)
 */
r.get("/:id/messages", auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { before } = req.query;
    const q = { conversation: id };
    if (before) q.createdAt = { $lt: new Date(before) };
    const msgs = await Message.find(q).sort({ createdAt: -1 }).limit(30);
    res.json({ success: true, data: msgs.reverse() });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /chat/:id/send
 * Body: { text, attachments }
 * Persists and (your Socket.IO server will broadcast)
 */
r.post("/:id/send", auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text, attachments } = req.body || {};
    if (!text && !(attachments?.length)) {
      return res.status(400).json({ success: false, message: "text or attachments required" });
    }
    const msg = await createMessage({
      conversationId: id,
      sender: req.user._id,
      text,
      attachments,
    });
    await touchConversation(id, msg);
    res.json({ success: true, data: msg });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /chat/:id/read
 * Body: { at? }
 */
r.post("/:id/read", auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { at } = req.body || {};
    const resp = await markRead(id, req.user._id, at);
    res.json({ success: true, data: resp });
  } catch (e) {
    next(e);
  }
});

export default r;
