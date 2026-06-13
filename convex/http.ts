import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api"
import { patchSchema } from "../lib/schema"
import { Infer } from "convex/values";
import { ModelMessage } from "./validators";

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
      _id: result.data._id,
      content: result.data.content,
      status: result.data.status,
      modelMessages: result.data.modelMessages as Infer<typeof ModelMessage>[]
    })

    return new Response("", { status: 200 })
  })
})

export default http