import { z } from "zod"
import { eventType } from "inngest"

export const chatMessageSent = eventType("app/chat.message.sent", {
  schema: z.object({
    conversationId: z.string(),
    aiMessageId: z.string(),
    userMessage: z.string()
  })
})