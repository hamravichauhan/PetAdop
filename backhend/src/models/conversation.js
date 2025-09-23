import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }],
    petId: { type: mongoose.Schema.Types.ObjectId, ref: "Pet" },
    lastMessage: {
      text: String,
      at: Date,
      by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    // per-user unread count (stringified userId -> number)
    unread: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

// Reuse compiled model in dev/hot-reload
export const Conversation =
  mongoose.models.Conversation || mongoose.model("Conversation", ConversationSchema);
