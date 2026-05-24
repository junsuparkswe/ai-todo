import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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
  .searchIndex("search_text", { searchField: "text", filterFields: ["userId", "orgId", "isCompleted"]})
})