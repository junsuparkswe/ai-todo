import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { tool } from "ai";
import { ConvexHttpClient } from "convex/browser";
import { z } from "zod";

function makeCreateTodoTool(convex: ConvexHttpClient) {
  return tool({
    description: "Create a new todo",
    inputSchema: z.object({
      text: z.string().min(1),
    }),
    execute: async ({ text }) => {
      return await convex.mutation(api.todos.create, { text });
    },
  });
}

function makeToggleTodoTool(convex: ConvexHttpClient) {
  return tool({
    description: "Toggle a todo's completed status",
    inputSchema: z.object({
      todoId: z.string().min(1),
    }),
    execute: async ({ todoId }) => {
      await convex.mutation(api.todos.toggle, { id: todoId as Id<"todos"> });
      return { ok: true };
    },
  });
}

function makeGetTodoTool(convex: ConvexHttpClient) {
  return tool({
    description: "Read a single todo",
    inputSchema: z.object({
      todoId: z.string().min(1),
    }),
    execute: async ({ todoId }) => {
      return await convex.query(api.todos.get, { id: todoId as Id<"todos"> });
    },
  });
}

function makeListTodosTool(convex: ConvexHttpClient) {
  return tool({
    description: "Get multiple todos using filters",
    inputSchema: z.object({
      text: z.string().optional(),
      userId: z.string().optional(),
      isCompleted: z.boolean().optional(),
      createdBefore: z.number().optional(),
      createdAfter: z.number().optional(),
      dueBefore: z.number().optional(),
      dueAfter: z.number().optional(),
      completedBefore: z.number().optional(),
      completedAfter: z.number().optional(),
    }),
    execute: async (args) => {
      return await convex.query(api.todos.list, args);
    },
  });
}

function makeRemoveTodoTool(convex: ConvexHttpClient) {
  return tool({
    description: "Delete a todo",
    inputSchema: z.object({
      todoId: z.string().min(1),
    }),
    execute: async ({ todoId }) => {
      await convex.mutation(api.todos.remove, { id: todoId as Id<"todos"> });
      return { ok: true };
    },
  });
}

function makeUpdateTodoTool(convex: ConvexHttpClient) {
  return tool({
    description: "Update one or more fields of a todo",
    inputSchema: z.object({
      todoId: z.string().min(1),
      text: z.string().optional(),
      dueDate: z.number().optional(),
      completedAt: z.number().optional(),
    }),
    execute: async ({ todoId, completedAt, dueDate, text }) => {
      await convex.mutation(api.todos.patch, {
        todoId: todoId as Id<"todos">,
        text,
        dueDate,
        completedAt,
      });

      return { ok: true };
    },
  });
}

export function makeTodoTools(convex: ConvexHttpClient) {
  return {
    createTodo: makeCreateTodoTool(convex),
    toggleTodo: makeToggleTodoTool(convex),
    getTodo: makeGetTodoTool(convex),
    listTodos: makeListTodosTool(convex),
    removeTodo: makeRemoveTodoTool(convex),
    updateTodo: makeUpdateTodoTool(convex),
  };
}
