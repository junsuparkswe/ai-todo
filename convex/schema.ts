import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { ModelMessage } from "./validators";

export default defineSchema({
  todos: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
    userId: v.string(),

    // Timestamps
    createdAt: v.number(), // utc timestamp - convert with new Date(timeInMsSinceEpoch). get utc value with Date.now()
    updatedAt: v.number(), // utc timestamp
    dueDate: v.optional(v.number()), // utc timestamp
    completedAt: v.optional(v.number()), // utc timestamp

    // AI Context
    aiSummary: v.optional(v.string()),
    aiConfidence: v.optional(v.float64()), // 0 to 1
    embedding: v.optional(v.array(v.float64())),

    // Organization & Meta
    orgId: v.string(), // every todo must be in an org.
    // tags: v.array(v.string()), // defaults to [] -- 5.22 nevermind, too complicated
    // priority: v.number() // higher number = higher priority. every task starts at 0. can be negative -- 5.22 nevermind, too complicated
  })
    .index("by_org_user", ["orgId", "userId"])
    .index("by_org_isCompleted", ["orgId", "isCompleted"])
    .searchIndex("search_text", {
      searchField: "text",
      filterFields: ["userId", "orgId", "isCompleted"],
    }),

  conversations: defineTable({
    orgId: v.string(),
    userId: v.string(),
    title: v.string(),
    createdAt: v.number()
  })
    .index("by_org_user_date", ["orgId", "userId", "createdAt"])
    .index("by_org_date", ["orgId", "createdAt"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["orgId", "userId"]
    }),
    
  messages: defineTable({
    conversationId: v.id("conversations"),
    userId: v.string(),
    orgId: v.string(),
    role: v.union(
      v.literal("user"),
      v.literal("assistant")
    ),
    content: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("streaming"),
      v.literal("done"),
      v.literal("error")
    ),
    createdAt: v.number(),
    modelMessages: v.optional(
      v.array(ModelMessage)
    )
  })
    .index("by_conversation_status", ["conversationId", "status"])
});
