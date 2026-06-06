import { inngest } from '@/inngest/client';
import { chatMessageSentSchema } from '@/lib/schema';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const json = await req.json()
  const result = chatMessageSentSchema.safeParse(json)

  if (!result.success) {
    return new NextResponse(JSON.stringify(result.error.flatten()), { status: 400})
  }

  const response = await inngest.send({
    name: "app/chat.message.sent",
    data: {
      conversationId: result.data.conversationId,
      aiMessageId: result.data.aiMessageId,
      userMessage: result.data.userMessage
    }
  })

  return NextResponse.json(response)
}