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
    paginationOpts: paginationOptsValidator
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
      .withIndex("by_org_user_date", (q) => q
        .eq("orgId", user.orgId as string)
        .eq("userId", user.subject),
      )
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
