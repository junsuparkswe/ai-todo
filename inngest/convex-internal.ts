import { patchSchema } from "@/lib/schema";
import ky from "ky";
import { z } from "zod";

export async function patchMessage({
  _id,
  content,
  status,
  modelMessages
}: z.infer<typeof patchSchema>
) {
  await ky.post(
    `${process.env.CONVEX_HTTP_ACTIONS_URL}/internal/patch-message`,
    {
      headers: {
        Authorization: process.env.CONVEX_INTERNAL_SECRET
      },
      json: {
        _id,
        status,
        content,
        modelMessages
      }
    }
  )
}