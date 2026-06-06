"use client"

import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Doc } from "@/convex/_generated/dataModel"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface TodoItemProps {
  todo: Doc<"todos">
}

export function TodoItem({ todo }: TodoItemProps) {
  const toggle = useMutation(api.todos.toggle)
  const remove = useMutation(api.todos.remove)

  return (
    <Card className="w-full flex flex-row items-center gap-4 px-4 py-3 border-none shadow-sm bg-muted/30 hover:bg-muted/50 transition-colors">
      <Checkbox
        checked={todo.isCompleted}
        onCheckedChange={() => toggle({ id: todo._id })}
      />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium truncate transition-all",
            todo.isCompleted && "text-muted-foreground line-through",
          )}
        >
          {todo.text}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        className="opacity-0 group-hover/card:opacity-100 transition-opacity"
        onClick={() => {
          remove({ id: todo._id })
          toast.success("Todo deleted")
        }}
      >
        <Trash2Icon className="size-4 text-destructive" />
        <span className="sr-only">Delete</span>
      </Button>
    </Card>
  )
}
