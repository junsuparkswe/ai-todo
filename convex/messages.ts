import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { ModelMessage } from "./validators";
import schema from "./schema";

export const send = mutation({
  args: {
    content: v.string(),
    conversationId: v.id("conversations"),
  },
  returns: v.id("messages"),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      throw new Error("Unauthenticated");
    }

    if (!user.orgId) {
      throw new Error("User must be in an organization");
    }

    const now = Date.now();

    await ctx.db.insert("messages", {
      content: args.content,
      conversationId: args.conversationId,
      createdAt: now,
      orgId: user.orgId as string,
      role: "user",
      status: "done",
      userId: user.subject,
    });

    return await ctx.db.insert("messages", {
      content: "",
      status: "pending",
      conversationId: args.conversationId,
      createdAt: now,
      orgId: user.orgId as string,
      role: "assistant",
      userId: user.subject,
    });

  },
});

export const patch = internalMutation({
  args: {
    _id: v.id("messages"),
    content: v.string(),
    status: v.union(
      v.literal("done"),
      v.literal("error"),
      v.literal("streaming"),
      v.literal("pending"),
    ),
    modelMessages: v.optional(v.array(ModelMessage))
  },
  handler: async (ctx, args) => {
    await ctx.db.patch("messages", args._id, {
      status: args.status,
      content: args.content,
      modelMessages: args.modelMessages
    });
  },
});

export const fetch = query({
  args: {
    conversationId: v.id("conversations"),
  },
  returns: v.array(v.object({
    _id: v.id("messages"),
    _creationTime: v.number(),
    ...schema.tables.messages.validator.fields
  })),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      throw new Error("Unauthenticated");
    }

    if (!user.orgId) {
      throw new Error("User must be in an organization");
    }

    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_id", (q) => q.eq("_id", args.conversationId))
      .first();

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (user.orgId !== conversation.orgId) {
      throw new Error("Unauthorized");
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_conversation_status", (q) =>
        q.eq("conversationId", args.conversationId).eq("status", "done"),
      )
      .order("asc")
      .take(200);
  },
});

export const list = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      throw new Error("Unauthenticated");
    }

    if (!user.orgId) {
      throw new Error("User must be in an organization");
    }

    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_id", (q) => q.eq("_id", args.conversationId))
      .first();

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (user.orgId !== conversation.orgId) {
      throw new Error("Unauthorized");
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_conversation_status", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("asc")
      .take(200);
  },
});
