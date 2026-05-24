import { TodoInput } from "@/features/components/todos/todo-input"
import { TodoList } from "@/features/components/todos/todo-list"

export default function TestPage() {
  return (
    <main className="flex justify-center">
      <div className="flex flex-col flex-1 mt-10 max-w-200 items-center gap-4">
        <TodoInput />
        <TodoList />
      </div>
    </main>
  )
}
