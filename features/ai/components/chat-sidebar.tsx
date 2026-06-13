"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { useConvexAuth, useMutation, usePaginatedQuery } from "convex/react";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function ChatSidebar() {
  const { isAuthenticated } = useConvexAuth();
  const params = useParams();
  const {
    loadMore,
    results: conversations,
    status,
  } = usePaginatedQuery(api.conversations.list, isAuthenticated ? {} : "skip", {
    initialNumItems: 30,
  });
  const create = useMutation(api.conversations.create);
  const router = useRouter();
  const deleteConversation = useMutation(api.conversations.remove);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-muted/30">
      <div className="p-3 border-b pb-2 mb-2">
        <span className="text-sm font-semibold">Conversations</span>
      </div>
      <div className="px-3 pb-2">
        <Button
          className="w-full justify-start gap-2"
          onClick={async () => {
            const id = await create();
            router.push(`/chat/${id}`);
          }}
        >
          <Plus className="size-4" />
          New conversation
        </Button>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3 pt-1">
        {conversations.map((conversation) => (
          <div
            key={conversation._id}
            className={cn(
              buttonVariants({
                variant:
                  conversation._id === params.conversationId
                    ? "secondary"
                    : "ghost",
              }),
              "flex justify-between group"
            )}
          >
            <Link href={`/chat/${conversation._id}`} className="flex-1 min-w-0">
              <span className="truncate">{conversation.title}</span>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="group-hover:visible invisible"
                  variant="destructive"
                >
                  <Trash2 size="icon" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      deleteConversation({ conversationId: conversation._id });
                      if (conversation._id === params.conversationId)
                        router.push("/chat");
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
        {status === "LoadingFirstPage" && (
          <div className="flex flex-col gap-1">
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
          </div>
        )}
        {conversations.length === 0 && status !== "LoadingFirstPage" && (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            No conversations yet
          </p>
        )}
        {status === "CanLoadMore" && (
          <Button onClick={() => loadMore(30)} size="sm" variant="ghost">
            Load more
          </Button>
        )}
      </nav>
    </aside>
  );
}
