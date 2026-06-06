import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api"
import { Id } from "./_generated/dataModel";
import { z } from "zod";
import { patchSchema } from "../lib/schema"

const http = httpRouter()

http.route({
  path: "/internal/patch-message",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const authHeader = request.headers.get("Authorization")

    if (authHeader === null || authHeader !== process.env.CONVEX_INTERNAL_SECRET) {
      return new Response("Unauthorized", { status: 401 })
    }

    const json = await request.json()
    const result = patchSchema.safeParse(json)

    if (!result.success) {
      return new Response(JSON.stringify(result.error.flatten()), { status: 400 })
    }

    await ctx.runMutation(internal.messages.patch, {
      _id: result.data._id as Id<"messages">,
      content: result.data.content,
      status: result.data.status
    })

    return new Response("", { status: 200 })
  })
})

http.route({
  path: "/internal/fetch-conversation",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const authHeader = request.headers.get("Authorization")

    if (authHeader === null || authHeader !== process.env.CONVEX_INTERNAL_SECRET) {
      return new Response("Unauthorized", { status: 401 })
    }

    const conversationId = new URL(request.url).searchParams.get("conversationId")

    const result = z.string().min(1).safeParse(conversationId)

    if (!result.success) {
      return new Response(JSON.stringify(result.error.flatten()), { status: 400 })
    }

    const messages = await ctx.runQuery(internal.messages.fetch, {
      conversationId: result.data as Id<"conversations">
    })

    return Response.json(messages)
  })
})

export default http