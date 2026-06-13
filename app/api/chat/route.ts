import { inngest } from '@/inngest/client';
import { chatMessageSentSchema } from '@/lib/schema';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server"

export async function POST(req: NextRequest) {
  const { getToken } = await auth()
  const clerkToken = await getToken()
  if (!clerkToken) {
    return NextResponse.json({ error: "Unautheticated" }, { status: 401 })
  }

  const json = await req.json()
  const result = chatMessageSentSchema.pick({
    aiMessageId: true,
    conversationId: true,
    userMessage: true
  }).safeParse(json)

  if (!result.success) {
    return new NextResponse(JSON.stringify(result.error.flatten()), { status: 400})
  }

  const response = await inngest.send({
    name: "app/chat.message.sent",
    data: {
      conversationId: result.data.conversationId,
      aiMessageId: result.data.aiMessageId,
      userMessage: result.data.userMessage,
      clerkToken
    }
  })

  return NextResponse.json(response)
}