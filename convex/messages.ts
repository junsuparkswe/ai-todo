import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";

export const send = mutation({
  args: {
    content: v.string(),
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
      v.literal("pending")
    )
  },
  handler: async (ctx, args) => {
    await ctx.db.patch("messages", args._id, {
      status: args.status,
      content: args.content
    })
  }
})

export const fetch = internalQuery({
  args: {
    conversationId: v.id("conversations")
  },
  handler: async (ctx, args) => {
    return await ctx.db.query("messages")
      .withIndex("by_conversation_status", q => q
        .eq("conversationId", args.conversationId)
        .eq("status", "done")
      )
      .order("asc")
      .take(200)
  }
})

export const list = query({
  args: {
    conversationId: v.id("conversations")
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()

    if (!user) {
      throw new Error("Unauthenticated")
    }

    if (!user.orgId) {
      throw new Error("User must be in an organization")
    }

    return await ctx.db.query("messages")
      .withIndex("by_conversation_status", q => q
        .eq("conversationId", args.conversationId)
      )
      .order("desc")
      .take(200)
  }
})