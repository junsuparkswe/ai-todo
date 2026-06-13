// src/inngest/functions.ts
import { generateText, type ModelMessage, stepCountIs } from "ai";
import { inngest } from "./client";
import { chatMessageSent } from "./event-types";
import { ConvexHttpClient } from "convex/browser";
import { makeTodoTools } from "./tools";
import { api } from "@/convex/_generated/api";
import { patchMessage } from "./convex-internal";

export const processMessage = inngest.createFunction(
  {
    id: "process-message",
    triggers: [chatMessageSent],
  },
  async ({ event, step }) => {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    convex.setAuth(event.data.clerkToken);

    const messages = await step.run("fetch-conversation", async () => {
      return await convex.query(api.messages.fetch, {
        conversationId: event.data.conversationId,
      });
    });

    const response = await step.run("message-ai", async () => {
      const r = await generateText({
        model: "google/gemini-3-flash",
        messages: messages.flatMap((message) => {
          if (message.modelMessages) {
            return message.modelMessages as unknown as ModelMessage[];
          } else {
            return {
              role: message.role,
              content: message.content,
            } as ModelMessage;
          }
        }),
        tools: makeTodoTools(convex),
        stopWhen: stepCountIs(15),
        system:
          "You are an assistant for a simple todo app. The user may prompt you to take certain actions on a todo. The todo IDs are not user-visible; when the user refers to one or more todos, call listTodos first to resolve the ids, then act.",
      });
      return {
        text: r.text ?? "",
        toolNames: r.steps.flatMap((s) => s.toolCalls.map((c) => c.toolName)),
        modelMessages: r.response.messages,
      };
    });

    await step.run("patch-convex", async () => {
      await patchMessage({
        _id: event.data.aiMessageId,
        content: response.text,
        status: "done",
      });
    });

    const isFirstTurn = !messages.some((m) => m.role === "assistant");
    if (isFirstTurn) {
      await step.run("generate-title", async () => {
        const firstMessage = messages.find(m => m.role === "user")
        if (!firstMessage) return;

        const r = await generateText({
          model: "google/gemini-2.5-flash-lite",
          system: "Create conversation title based on first prompt from the user, less than 5 words, no quotes",
          prompt: firstMessage.content
        })

        await convex.mutation(api.conversations.updateTitle, {
          conversationId: event.data.conversationId,
          title: r.text.trim()
        })
      })
    }

    return { aiMessageId: event.data.aiMessageId };
  },
);
