'use client'
import { Button } from "@/components/ui/button";
import ky from "ky";
import { Input } from "./ui/input";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function InngestDemo() {
  const [value, setValue] = useState("")
  const post = useMutation(api.messages.send)

  return (
    <div>
      <p>Inngest Demo</p>
      <Button
        onClick={async () => {
          const aiMessageId = await post({
            content: value,
            conversationId: "jd73t64vf1cdp8eynscctkcw7d882gtr" as Id<"conversations">
          })

          const response = await ky.post("/api/chat", {
            json: {
              conversationId: "jd73t64vf1cdp8eynscctkcw7d882gtr",
              aiMessageId,
              userMessage: value
            }
          })
        }}
      >
        Invoke Inngest function
      </Button>
      <Input value={value} onChange={e => setValue(e.target.value)} />
    </div>
  );
}
