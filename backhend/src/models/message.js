import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    text: { type: String, default: "" },
    attachments: [
      {
        url: String,
        name: String,
        type: String,
        size: Number,
      },
    ],
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", MessageSchema);
