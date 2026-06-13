"use client";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import ky from "ky";
import { MessageSquare } from "lucide-react";

function TypingDots() {
  return (
    <span className="flex gap-1 py-1">
      <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]" />
      <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]" />
      <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50" />
    </span>
  );
}

export default function ChatPane({
  conversationId,
}: {
  conversationId: Id<"conversations">;
}) {
  const { isAuthenticated } = useConvexAuth();
  const send = useMutation(api.messages.send);
  const messages = useQuery(
    api.messages.list,
    conversationId && isAuthenticated ? { conversationId } : "skip",
  );

  // Reactive: flips back to false on its own when Inngest patches the
  // assistant message to "done" — no manual submitting state needed.
  const isGenerating =
    messages?.some(
      (message) =>
        message.role === "assistant" &&
        (message.status === "pending" || message.status === "streaming"),
    ) ?? false;

  const handleSubmit = async (message: PromptInputMessage) => {
    const text = message.text.trim();
    if (!text || isGenerating) {
      return;
    }
    const aiMessageId = await send({ content: text, conversationId });
    await ky.post("/api/chat", {
      json: { conversationId, aiMessageId, userMessage: text },
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Conversation>
        <ConversationContent>
          {messages && messages.length === 0 ? (
            <ConversationEmptyState
              description="Send a message to start the conversation."
              icon={<MessageSquare className="size-12" />}
              title="No messages yet"
            />
          ) : (
            messages?.map((message) => (
              <Message from={message.role} key={message._id}>
                <MessageContent>
                  {message.content ? (
                    <MessageResponse>{message.content}</MessageResponse>
                  ) : message.status === "error" ? (
                    <span className="text-sm text-destructive">
                      Something went wrong. Please try again.
                    </span>
                  ) : message.role === "assistant" ? (
                    <TypingDots />
                  ) : null}
                </MessageContent>
              </Message>
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t p-4">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea placeholder="Message the assistant..." />
          </PromptInputBody>
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit
              disabled={isGenerating}
              status={isGenerating ? "submitted" : "ready"}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
