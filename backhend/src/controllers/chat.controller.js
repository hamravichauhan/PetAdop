import { Conversation } from "../models/conversation.js";
import { Message } from "../models/Message.js";

/**
 * Create (or get existing) conversation between two users for a pet
 */
export async function createOrGetConversation(userA, userB, petId) {
  let convo = await Conversation.findOne({
    participants: { $all: [userA, userB] },
    petId,
  });

  if (!convo) {
    convo = await Conversation.create({
      participants: [userA, userB],
      petId,
      unread: { [userA]: 0, [userB]: 0 },
    });
  }
  return convo;
}

/**
 * Persist a message and return populated object (sender minimal fields)
 */
export async function createMessage({ conversationId, sender, text, attachments }) {
  const msg = await Message.create({
    conversation: conversationId,
    sender,
    text,
    attachments,
  });

  // Populate sender (adjust fields as your User model allows)
  await msg.populate("sender", "username fullname");
  return msg.toObject();
}

/**
 * Update conversation unread counters and lastMessage fields
 */
export async function touchConversation(conversationId, msg) {
  const convo = await Conversation.findById(conversationId);
  if (!convo) return;

  // increment unread count for other participants
  for (const uid of convo.participants) {
    const key = String(uid);
    if (key !== String(msg.sender)) {
      convo.unread.set(key, (convo.unread.get(key) || 0) + 1);
    }
  }

  convo.lastMessage = {
    text: msg.text || "[attachment]",
    at: new Date(),
    by: msg.sender,
  };

  await convo.save();
}

/**
 * Mark all as read for user
 */
export async function markRead(conversationId, userId, at = new Date()) {
  const convo = await Conversation.findById(conversationId);
  if (!convo) return;
  convo.unread.set(String(userId), 0);
  await convo.save();
  return { ok: true, at };
}
