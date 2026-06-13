import { v } from "convex/values";

export const ModelMessage = v.object({
  role: v.union(
    v.literal("assistant"),
    v.literal("tool")
  ),
  content: v.array(
    v.union(
      v.object({
        type: v.literal("text"),
        text: v.string(),
        providerOptions: v.optional(v.any())
      }),
      v.object({
        type: v.literal("tool-call"),
        toolCallId: v.string(),
        toolName: v.string(),
        input: v.any(),
        providerOptions: v.optional(v.any())
      }),
      v.object({
        type: v.literal("tool-result"),
        toolCallId: v.string(),
        toolName: v.string(),
        output: v.object({
          type: v.string(),
          value: v.any()
        }),
        providerOptions: v.optional(v.any())
      })
    )
  )
})