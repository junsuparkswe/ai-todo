import { z } from "zod";

export const messageSchema = z.object({
  _id: z.string(),
  _creationTime: z.number(),
  conversationId: z.string().min(1),
  userId: z.string().min(1),
  orgId: z.string().min(1),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  status: z.enum([
    "streaming",
    "done",
    "error",
    "pending"
  ]),
  createdAt: z.number()
})

export const patchSchema = messageSchema.pick({
  _id: true,
  content: true,
  status: true
})

export const chatMessageSentSchema = z.object({
  conversationId: z.string().min(1),
  aiMessageId: z.string().min(1),
  userMessage: z.string().min(1)
})