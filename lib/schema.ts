import { Id } from "../convex/_generated/dataModel";
import { z } from "zod";

export const messageSchema = z.object({
  _id: z.custom<Id<"messages">>(
    (val) => typeof val === "string" && val.length > 0,
    { message: "Invalid message ID" },
  ),
  _creationTime: z.number(),
  conversationId: z.string().min(1),
  userId: z.string().min(1),
  orgId: z.string().min(1),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  status: z.enum(["streaming", "done", "error", "pending"]),
  createdAt: z.number(),
  modelMessages: z.array(z.unknown()).optional()
});

export const patchSchema = messageSchema.pick({
  _id: true,
  content: true,
  status: true,
  modelMessages: true
});

export const chatMessageSentSchema = z.object({
  conversationId: z.custom<Id<"conversations">>(
    (val) => typeof val === "string" && val.length > 0,
    { message: "Invalid conversation ID" },
  ),
  aiMessageId: z.custom<Id<"messages">>(
    (val) => typeof val === "string" && val.length > 0,
    { message: "Invalid message ID" },
  ),
  userMessage: z.string().min(1),
  clerkToken: z.string().min(1),
});
