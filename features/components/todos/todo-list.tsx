"use client"

import { useConvexAuth, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { TodoItem } from "./todo-item"
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

export function TodoList() {
  const { isAuthenticated } = useConvexAuth()
  
  const todos = useQuery(api.todos.list, isAuthenticated ? {} : "skip")

  if (todos === undefined) {
    return (
      <div className="flex flex-col w-full max-w-md gap-3">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    )
  }

  if (todos.length === 0) {
    return (
      <Empty className="mt-8">
        <EmptyTitle>No tasks yet</EmptyTitle>
        <EmptyDescription>
          Get started by adding a task above. Your workspace is currently empty.
        </EmptyDescription>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col w-full max-w-md gap-3">
      {todos.map((todo) => (
        <TodoItem key={todo._id} todo={todo} />
      ))}
    </div>
  )
}
