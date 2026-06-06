// src/inngest/functions.ts
import { generateText } from "ai";
import { inngest } from "./client";
import ky from "ky";
import { messageSchema } from "@/lib/schema";
import { z } from "zod";
import { chatMessageSent } from "./event-types";

const messagesSchema = z.array(messageSchema)

export const processMessage = inngest.createFunction(
  {
    id: "process-message",
    triggers: [chatMessageSent],
  },
  async ({ event, step }) => {
    const messages = await step.run("fetch-conversation", async () => {
      return await ky.get(`${process.env.CONVEX_HTTP_ACTIONS_URL}/internal/fetch-conversation`, {
        headers: {
          Authorization: process.env.CONVEX_INTERNAL_SECRET,
        },
        searchParams: {
          conversationId: event.data.conversationId
        }
      }).json()
    })

    const result = messagesSchema.safeParse(messages)

    if (!result.success) {
      await step.run("patch-error", async () => {
        await ky.post(`${process.env.CONVEX_HTTP_ACTIONS_URL}/internal/patch-message`, {
          headers: {
            Authorization: process.env.CONVEX_INTERNAL_SECRET,
          },
          json: {
            _id: event.data.aiMessageId,
            status: "error",
            content: ""
          },
        });
      })
      return { error: "Wrong message type" }
    }

    const response = await step.run("message-ai", async () => {
      return await generateText({
        model: "google/gemini-3.1-flash-lite",
        messages: result.data.map(message => ({
          role: message.role,
          content: message.content
        }))
      });
    });

    await step.run("patch-convex", async () => {
      await ky.post(`${process.env.CONVEX_HTTP_ACTIONS_URL}/internal/patch-message`, {
        headers: {
          Authorization: process.env.CONVEX_INTERNAL_SECRET,
        },
        json: {
          _id: event.data.aiMessageId,
          content: response.text,
          status: "done",
        },
      });
    });

    return { aiMessageId: event.data.aiMessageId }
  },
);
