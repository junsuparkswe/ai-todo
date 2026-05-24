import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()

    if (!user) {
      throw new Error("Unauthenticated")
    }

    if (!user.orgId) {
      throw new Error("User must be in an organization")
    }
  
    const now = Date.now()
  
    const todoId = await ctx.db.insert("todos", {
      text: args.text,
      userId: user.subject,
      orgId: user.orgId as string,
      isCompleted: false,
      createdAt: now,
      updatedAt: now,
    })

    return { success: true, todoId };
  }
})

export const get = query({
  args: {
    id: v.id("todos")
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()

    if (!user) {
      throw new Error("Unauthenticated")
    }

    const todo = await ctx.db.get("todos", args.id)

    if (!todo) {
      throw new Error("Todo not found")
    }

    if (user.orgId !== todo.orgId) {
      throw new Error("Unauthorized")
    }

    return todo;
  }
})

export const list = query({
  args: {
    // Primary Filters
    text: v.optional(v.string()),
    userId: v.optional(v.string()),
    isCompleted: v.optional(v.boolean()),

    // Date Ranges
    createdBefore: v.optional(v.number()),
    createdAfter: v.optional(v.number()),
    dueBefore: v.optional(v.number()),
    dueAfter: v.optional(v.number()),
    completedBefore: v.optional(v.number()),
    completedAfter: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()

    if (!user) {
      throw new Error("Unauthenticated")
    }

    if (!user.orgId) {
      throw new Error("Unauthorized")
    }

    const orgId = user.orgId as string;
    const {
      userId,
      text,
      isCompleted,
      completedAfter,
      completedBefore,
      createdAfter,
      createdBefore,
      dueAfter,
      dueBefore
    } = args;
    let query;

    // Branch 1: full-text search (exclusive)

    if (text) {
      query = ctx.db.query("todos")
        .withSearchIndex("search_text", q => { 
          let search = q
            .search("text", text)
            .eq("orgId", orgId)
          
          if (args.userId) {
            search = search.eq("userId", args.userId)
          }

          if (args.isCompleted !== undefined) {
            search = search.eq("isCompleted", args.isCompleted)
          }

          return search
        })

    // Branch 2: high impact index query
    } else {
      if (userId) {
        query = ctx.db.query("todos")
          .withIndex("by_org_user", q => q
            .eq("orgId", orgId)
            .eq("userId", userId)
          )
      } else if (isCompleted !== undefined) {
        query = ctx.db.query("todos")
          .withIndex("by_org_isCompleted", q => q
            .eq("orgId", orgId)
            .eq("isCompleted", isCompleted)
          )
      } else {
        query = ctx.db.query("todos")
          .withIndex("by_org_user", q => q.eq("orgId", orgId))
      }
    }

    // Refinement filters

    if (completedAfter) {
      query = query.filter(q => q.gte(q.field("completedAt"), completedAfter))
    }

    if (completedBefore) {
      query = query.filter(q => q.lte(q.field("completedAt"), completedBefore))
    }

    if (dueAfter) {
      query = query.filter(q => q.gte(q.field("dueDate"), dueAfter))
    }

    if (dueBefore) {
      query = query.filter(q => q.lte(q.field("dueDate"), dueBefore))
    }

    if (createdAfter) {
      query = query.filter(q => q.gte(q.field("createdAt"), createdAfter))
    }

    if (createdBefore) {
      query = query.filter(q => q.lte(q.field("createdAt"), createdBefore))
    }

    return await query.collect()
  }
})

export const toggle = mutation({
  args: {
    id: v.id("todos")
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()

    if (!user) {
      throw new Error("Unauthenticated")
    }

    const todo = await ctx.db.get("todos", args.id)

    if (!todo) {
      throw new Error("Todo not found")
    }

    if (user.orgId !== todo.orgId) {
      throw new Error("Unauthorized")
    }

    const now = Date.now()

    if (todo.isCompleted === false) {
      await ctx.db.patch("todos", args.id, {
        isCompleted: true,
        updatedAt: now,
        completedAt: now
      })
    } else {
      await ctx.db.patch("todos", args.id, {
        isCompleted: false,
        updatedAt: now,
        completedAt: undefined
      })
    }
  }
})

export const remove = mutation({
  args: {
    id: v.id("todos")
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()

    if (!user) {
      throw new Error("Unauthenticated")
    }

    const todo = await ctx.db.get("todos", args.id)

    if (!todo) {
      throw new Error("Todo not found")
    }

    if (user.orgId !== todo.orgId) {
      throw new Error("Unauthorized")
    }

    await ctx.db.delete("todos", args.id)
  }
})