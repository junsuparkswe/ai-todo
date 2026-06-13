import { Id } from "@/convex/_generated/dataModel";
import ChatPane from "@/features/ai/components/chat-pane";

export default async function ConversationIdPage({
  params,
}: {
  params: Promise<{
    conversationId: string;
  }>;
}) {
  const { conversationId } = await params;
  return <ChatPane conversationId={conversationId as Id<"conversations">} />;
}
