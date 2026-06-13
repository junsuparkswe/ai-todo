import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const create = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      throw new Error("Unauthenticated");
    }

    if (!user.orgId) {
      throw new Error("User must be in an organization");
    }

    const now = Date.now();

    const conversationId = await ctx.db.insert("conversations", {
      createdAt: now,
      orgId: user.orgId as string,
      userId: user.subject,
      title: "New Conversation", // to be replaced by AI generated title
    });

    return conversationId;
  },
});

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      throw new Error("Unauthenticated");
    }

    if (!user.orgId) {
      throw new Error("User must be in an organization");
    }

    return await ctx.db
      .query("conversations")
      .withIndex("by_org_user_date", (q) =>
        q.eq("orgId", user.orgId as string).eq("userId", user.subject),
      )
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const updateTitle = mutation({
  args: {
    conversationId: v.id("conversations"),
    title: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      throw new Error("Unauthenticated");
    }

    if (!user.orgId) {
      throw new Error("User must be in an organization");
    }

    const conversation = await ctx.db.get("conversations", args.conversationId);

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (conversation.orgId !== user.orgId) {
      throw new Error("User does not belong to this organization");
    }

    await ctx.db.patch("conversations", args.conversationId, {
      title: args.title,
    });
  },
});

export const remove = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      throw new Error("Unauthenticated");
    }

    if (!user.orgId) {
      throw new Error("User must be in an organization");
    }

    const conversation = await ctx.db.get("conversations", args.conversationId);

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (conversation.orgId !== user.orgId) {
      throw new Error("User does not belong to this organization");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_status", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    const deleteMessages = messages.map((message) =>
      ctx.db.delete("messages", message._id),
    );
    await Promise.all(deleteMessages);

    await ctx.db.delete("conversations", args.conversationId);
  },
});
