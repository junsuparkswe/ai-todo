import { z } from "zod"
import { eventType } from "inngest"
import { chatMessageSentSchema } from "@/lib/schema";

export const chatMessageSent = eventType("app/chat.message.sent", {
  schema: chatMessageSentSchema
})