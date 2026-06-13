import ChatSidebar from "@/features/ai/components/chat-sidebar";
import { TodoInput } from "@/features/todos/components/todo-input";
import { TodoList } from "@/features/todos/components/todo-list";
import React from "react";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <ChatSidebar />
      {children}
      <aside className="flex w-80 shrink-0 flex-col border-l">
        {/* header - mirrors the "Conversations" label on the sidebar */}
        <div className="border-b p-4">
          <h2 className="text-sm font-semibold">Tasks</h2>
        </div>

        {/* pinned input - doesn't scroll away */}
        <div className="p-4">
          <TodoInput />
        </div>

        {/* only this region scrolls */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <TodoList />
        </div>
      </aside>
    </div>
  );
}
