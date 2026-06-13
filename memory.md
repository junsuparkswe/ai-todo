# Project Memory Log

## Current State
* **Framework:** Next.js (App Router, Turbopack)
* **Auth:** Clerk (configured with org-based multi-tenancy)
* **Database:** Convex (configured with schema and security rules)
* **Background Jobs:** Inngest (locally tested and serving endpoints)
* **Monitoring:** Sentry (configured across client, server, and edge runtimes with ad-blocker tunneling)
* **AI:** Vercel AI SDK v6 with Vercel AI Gateway (`@ai-sdk/google`, model string passed directly e.g. `"google/gemini-2.0-flash-lite"`)
* **Status:** Phase 7 (`07-ai-chat-interface`) **feature-complete and live-verified — committing now.** Backend AI tools wired and verified end-to-end (create/list/toggle/update/delete via chat). All blocking bugs resolved: Bug 1 (multi-step loop + serialization fix), Bug 2 **structurally fixed and verified** (verbatim `modelMessages` storage + flatMap reconstruction — see #13). **Chat UI live-verified (#14): `/chat` route, persistent sidebar, ai-elements pane, + reactive todo panel (3rd column).** AI-generated conversation titles DONE (#15, first-turn-gated `generate-title` step). Delete conversations DONE (#16, cascade + active-delete redirect). lint+build green. Remaining: atomic commits + PR to `main`; single-step durability debt still deferred (Path B).

---

## Key Phase 4 Resolutions

### 1. Inngest Dev Server Probing (Clerk Block)
* **Problem:** Inngest dev server was failing to connect to `localhost:3000/api/inngest` because Clerk's middleware was blocking the endpoint and redirecting it to the sign-in page.
* **Solution:** Exposed the Inngest endpoint by adding `'/api/inngest(.*)'` to the `isPublicRoute` array inside `proxy.ts`.

### 2. Vercel Build Failure (Missing generated files)
* **Problem:** Build failed on Vercel because `convex/_generated` is gitignored. The default `npx convex deploy --cmd 'npm run build'` ran the compiler before files were written to disk.
* **Solution:** Overrode the Vercel Build Command to `npx convex deploy && npm run build` to ensure sequential execution.

### 3. shadcn/ui Calendar Type Error
* **Problem:** The local `components/ui/calendar.tsx` had a compile-time type error: `'table' does not exist in type 'Partial<ClassNames>'` because the project is using `react-day-picker` v10 where `table` was removed.
* **Solution:** Updated `calendar.tsx` by replacing the `table` key styling with `month_grid` (the v10 equivalent).

### 4. Unauthenticated Query Crash on Page Load
* **Problem:** Visiting `/test` threw an uncaught server error `Unauthenticated` from `convex/todos.ts` because the frontend query ran immediately before the client finished fetching the Clerk JWT.
* **Solution:** Updated `TodoList` to use `useConvexAuth()` and pass the `"skip"` option to `useQuery` while `isAuthenticated` is false.

---

## Key Phase 5 Resolutions

### 1. Clerk Middleware Tunnel Block
* **Problem:** Sentry's `tunnelRoute` is set to `/monitoring` to bypass ad-blockers, but Clerk middleware was intercepting this route and redirecting unauthenticated telemetry payloads to `/sign-in`.
* **Solution:** Added `'/monitoring(.*)'` to Clerk's `isPublicRoute` matcher in `proxy.ts`.

---

## Key Phase 6 Resolutions

### 1. AI Streaming Architecture (Inngest vs. Convex)
* **Decision:** Using **Convex as the streaming bridge** rather than Inngest Durable Endpoints.
* **Flow:** Client calls `messages.send` (Convex mutation) → gets back `aiMessageId` → fires `app/chat.message.sent` Inngest event → Inngest calls LLM → patches Convex message via internal HTTP action → client `useQuery` reactively updates.

### 2. Convex TypeScript Node Types
* **Problem:** `process` was not recognized in `convex/http.ts` because `convex/tsconfig.json` didn't include Node types.
* **Solution:** Added `"types": ["node"]` to `compilerOptions` in `convex/tsconfig.json`. Applies to all files in `convex/`.

### 3. Convex Internal HTTP Actions for Inngest
* **Decision:** Inngest communicates with Convex via two HTTP actions in `convex/http.ts`, both protected by a shared `CONVEX_INTERNAL_SECRET` env var checked in the `Authorization` header:
  * `POST /internal/patch-message` — calls `internal.messages.patch`
  * `GET /internal/fetch-conversation` — calls `internal.messages.fetch` (filters to `status="done"`, used as AI history)

### 4. Auth Boundary for Message Creation
* **Decision:** Frontend calls `messages.send` (authenticated Convex mutation) to create user + assistant placeholder messages, then passes the returned `aiMessageId` to `/api/chat`. Inngest cannot call authenticated Convex mutations, so message creation must stay on the client side.

### 5. Zod Schema Field Naming
* `patchSchema` uses `_id` (picked from `messageSchema`) — Inngest sends `_id` in the patch request body to match. Using `messageId` as the field name would require a `.transform()` on the schema.

## Key Phase 7 Resolutions (in progress)

### 1. JWT Forwarding for AI Tools (chose direct ConvexHttpClient over internal HTTP actions)
* **Decision:** AI tools call **public** Convex `todos.*` functions via `ConvexHttpClient` + forwarded Clerk JWT — NOT a parallel set of internal HTTP actions.
* **Why:** Tool calls are user actions (the AI acts on behalf of the user), so user auth is conceptually right and reuses the existing `orgId` checks for free. JWT short lifetime is a non-issue because tool calls fire synchronously within the chat turn (seconds).
* **Contrast with Phase 6:** The `patch-message` path stays as an internal HTTP action + `CONVEX_INTERNAL_SECRET` because it's a privileged system write (users must not forge assistant content), has no user-auth dimension, and runs in retry-prone steps where a JWT could expire.
* **Clerk token:** Route uses `auth().getToken()` with **NO template arg** — the Clerk dashboard uses the new managed session-token customization (`aud: "convex"` + `orgId` claims), not a named JWT template.

### 2. ConvexHttpClient cannot call internal functions
* `ConvexHttpClient` only reaches public `api.*` functions over the external protocol, never `internal.*`. That's the structural reason the patch path still needs an HTTP action bridge.
* Client is instantiated **per-invocation** inside the Inngest handler (`new ConvexHttpClient(...)` + `setAuth(clerkToken)`), never module-level, because `setAuth` mutates instance state and would leak auth across concurrent runs.

### 3. AI Tools structure
* 6 tools in `inngest/tools.ts`: `createTodo`, `toggleTodo`, `getTodo`, `listTodos`, `removeTodo`, `updateTodo`.
* Each is its own factory (`makeCreateTodoTool(convex)` etc.), aggregated by `makeTodoTools(convex)` which the handler passes as `tools: makeTodoTools(convex)`.
* `patchMessage` helper extracted to `inngest/convex-internal.ts` (wraps the ky POST to `/internal/patch-message`); args typed via `z.infer<typeof patchSchema>`.
* Handler (`inngest/functions.ts`) simplified to ~25 lines: fetch history → AI with tools → patch result. Old `safeParse` + `patch-error` step deleted (typed Convex queries made it dead code).

### 4. messages.fetch promoted to public query
* `messages.fetch` moved from `internalQuery` to public `query` (with auth + org-ownership check) so the Inngest handler reads history via `ConvexHttpClient`. The old `/internal/fetch-conversation` HTTP action and its caller were deleted. Use `fetch` (filters to `status="done"`), NOT `list` (returns all statuses, for the UI).

### 5. Request vs. event schema split
* `lib/schema.ts`: `chatRequestSchema` validates the `/api/chat` request body (no `clerkToken`); `chatMessageSentSchema = chatRequestSchema.extend({ clerkToken })` types the Inngest event. The route is a security boundary — the browser cannot submit a JWT it didn't already have.

### 6. Branded Convex IDs in Zod
* Use `z.custom<Id<"...">>((val) => typeof val === "string" && val.length > 0)` to brand IDs in Zod schemas (`v.id(...)` is a Convex validator and does NOT work inside Zod). Removes manual `as Id<...>` casts at call sites. Honest caveat: this brands on faith — it can't verify the string is a real doc ID.

### 7. Convex `returns` validator required for typed client returns
* Without a `returns` validator, the generated `FunctionReference` types the return as `null` regardless of what the handler returns. Added `returns: v.id("messages")` to `messages.send` to fix `aiMessageId` typing on the frontend. TODO: audit other functions (`todos.toggle`/`remove`/`patch` → `v.null()`; `todos.create` → object; queries → array shapes).

### 8. Convex tsc doesn't know the `@/` path alias
* Files in `lib/` that get imported by `convex/` must use relative imports (e.g. `../convex/_generated/dataModel`), not `@/convex/...`. Convex runs its own tsc over `convex/**` + their imports, and its tsconfig lacks the `@/` alias. Hit this in `lib/schema.ts`.

### 9. Bug 1 RESOLVED — multi-step loop + model swap (single-step spike)
* **Fix had two independent parts:**
  1. **Multi-step tool use:** added `stopWhen: stepCountIs(15)` to `generateText` (the v6 API — `maxSteps` is the old v4 name) plus a `system` prompt telling the model that todo IDs are opaque and to call `listTodos` first to resolve them. This lets the SDK loop infer→tool→feed-result-back→infer so the model can act on real IDs.
  2. **Model swap:** `openai/gpt-3.5-turbo` was too weak for agentic multi-step tool use (it hallucinated tool results — "no todos", "already completed"). Swapped to a stronger gateway model, which fixed the tool *decisions*. Lesson: tool-loop reliability is model-bound.
* **Architecture note for the article:** the whole loop runs inside a single `step.run("message-ai")` — the "single-step spike". Inngest sees one opaque box. Known durability debt: a retry mid-loop re-runs every tool → duplicate/non-idempotent mutations + re-burned tokens, and no per-tool telemetry. Upgrade path ("Path B"): hand-roll the loop so Inngest owns it (per-tool `step.run` + `step.ai` for inference + idempotency keys), or adopt AgentKit. Deferred deliberately; spike-first was to validate model/tool behavior cheaply.

### 10. The `step.run` boundary is a JSON-serialization boundary (caused the patch-message 400)
* **Bug:** `generateText` returns a `DefaultGenerateTextResult` where `.text`, `.toolCalls`, `.content` are **getters on the prototype** (only `steps`/`_output`/`totalUsage` are own properties). Inngest memoizes step return values via `JSON.stringify`, which **does not call prototype getters**. So returning the raw result from `step.run` stripped `.text` → `content: undefined` → Convex Zod rejected the patch body → HTTP 400.
* **Fix:** read the getters *inside* the step and return a **plain object literal** (`{ text: r.text ?? "", toolNames: r.steps.flatMap(s => s.toolCalls.map(c => c.toolName)) }`). Plain own enumerable props survive serialization. `toolNames` doubles as a diagnostic of which tools fired per turn.
* **General rule:** never return rich SDK result objects across an Inngest step boundary — extract primitives first.

### 11. Bug 2 SOFT-FIXED (not structural) — assistant turns now appear in history
* **Real root cause:** before the #10 fix, assistant messages never reached `status="done"` (patch 400'd), so `messages.fetch` (which filters to `done`) returned history as a wall of user-only messages → model read them as unfulfilled commands and re-fired tools for all of them.
* **Why it's fixed now:** assistant replies now persist to `done`, so history is interleaved user+assistant. The model sees its own prose confirmations ("Deleted the gym todo.") and infers prior requests are already handled.
* **Why it's SOFT, not structural:** history is still plain `{ role, content }` — no tool-call/tool-result metadata persisted. It relies on the model narrating every action and re-reading its own prose. Fragile at edges: terse confirmations, empty final text (`r.text ?? ""` persists `""` on a turn that ends on a tool call), ambiguous follow-ups ("do that again"), and weaker models.
* **Proper fix (still TODO):** persist the AI SDK `response.messages` and replay structurally — design finalized in resolution #12 from real payloads.

### 12. Structural Bug-2 fix — schema design from REAL Gemini-3-flash payloads (DESIGN — implemented in #13)
Logged two real `result.response.messages` payloads: a plain-chat turn and a "turn these into todos" turn (17 parallel `createTodo` calls).

**Observed shape (uniform across SDK providers — see validator note):**
* A turn = `ModelMessage[]`. Generated roles are only **`assistant`** and **`tool`** (never `user`/`system` — those are our own rows). `content` is **always an array of parts**, even for a single text part.
* Part types seen: `text`, `tool-call`, `tool-result`.
  * `text`  → `{ type:"text", text:string, providerOptions? }`
  * `tool-call`  → `{ type:"tool-call", toolCallId:string, toolName:string, input:<any>, providerOptions? }`
  * `tool-result`  → `{ type:"tool-result", toolCallId:string, toolName:string, output:{ type:string, value:<any> }, providerOptions? }`
* Tool-result `output` is a **wrapped envelope** `{ type:"json", value:{...} }`, NOT the raw tool return (our `createTodo`'s `{success,todoId}` landed under `output.value`). `output.type` was `"json"` — do NOT pin to `literal("json")`; a throwing tool yields `error-json`/`error-text`.
* Turn structure example: ONE assistant message with 17 `tool-call` parts → ONE `tool` message with 17 `tool-result` parts (paired by `toolCallId`) → final assistant `text` message = **3 messages**. Reconstruction must "explode" an assistant row into multiple ModelMessages.

**Finding A — `thoughtSignature` forces verbatim storage (Gemini 3 / Vertex):**
* Parts carry `providerOptions.vertex.thoughtSignature` (opaque base64), present on the **first part** of each message only.
* Gemini 3 requires thought signatures be **echoed back on subsequent requests** or reasoning context breaks. ⇒ MUST persist `providerOptions` intact and replay it. Hand-rebuilding parts (dropping providerOptions) would break Gemini. This is the hard provider requirement behind "store `response.messages` verbatim" (§A2 / #11).

**Finding B — one validator, no per-model split:**
* SDK normalizes all providers to the same envelope; the only model-specific data (`thoughtSignature`) lives inside `providerOptions`. The "fallback validator for other models" we discussed is unnecessary — it reduces to keeping `providerOptions` loose. ONE validator serves Gemini + every other SDK model.

**Validator = precise ENVELOPE, loose SEAMS (Convex `v`, defined in `convex/`):**
* Precise: `type` literals; `toolCallId`/`toolName`/`text` as `v.string()`; role `v.union(v.literal("assistant"), v.literal("tool"))`; `content` `v.array(v.union(textPart, toolCallPart, toolResultPart))`; `output` `v.object({ type: v.string(), value: v.any() })`.
* Loose seams (`v.any()`): tool-call `input`, tool-result `output.value`, and `providerOptions`. Convex objects reject unknown keys, so do NOT precisely type `providerOptions` (would reject openai/anthropic namespaces + break model swappability) — use `v.optional(v.any())`.
* No catch-all part variant ⇒ an unmodeled part type fails the write LOUD (wanted for a learning project — surfaces new model output immediately).

**Storage & reconstruction plan (A2):**
* Add `modelMessages: v.optional(v.array(<modelMessage>))` to the `messages` table; patch it on the assistant row alongside `content` (= `result.text`, kept for the UI bubble). Keep the `status="done"` filter.
* Extract `result.response.messages` into the plain step return — it's behind the `response` getter, so it must cross the `step.run` boundary as a plain value (#10).
* `messages.fetch` returns `modelMessages`; handler rebuilds history via flatMap: user row → `{role:"user", content}`; assistant row → spread its `modelMessages`. Do NOT store the user message inside `modelMessages` (it's its own row — avoid duplication). Update `fetch`'s `returns` validator (#7) to the richer shape.

### 13. Structural Bug-2 fix IMPLEMENTED + VERIFIED (the #12 design, shipped)
Built all 6 steps from #12. Files: `convex/validators.ts` (exports `ModelMessage` `v`-validator), `convex/schema.ts` (`modelMessages` field on `messages`), `convex/messages.ts` (`patch` arg + `fetch` returns), `lib/schema.ts` + `convex/http.ts` + `inngest/convex-internal.ts` (patch path), `inngest/functions.ts` (extract `r.response.messages` into plain step return; flatMap history reconstruction).

**Two reusable lessons (these are the keepers):**
* **`v` validators are plain reusable objects, NOT just for `defineTable`.** Define `ModelMessage` once as an exported `const` and feed the SAME reference into the table, the `patch` mutation `args`, and the `fetch` `returns`. Single source of truth — the storage/write/read shapes can't drift. (User initially thought `v` only worked inside `defineTable` — it's the same validator system used by function `args`/`returns`.)
* **Derive the `returns` validator from the table, don't hand-list it.** `fetch` returns full `Doc<"messages">[]`. Instead of re-typing every field (drift risk + Convex return-validation rejects BOTH missing AND extra keys, so easy to break), use `v.array(v.object({ _id: v.id("messages"), _creationTime: v.number(), ...schema.tables.messages.validator.fields }))`. The spread pins the return shape to the table def; only the two system fields are added manually. Strictly better than explicit — don't hedge on this.

**Loose-zod / loose-seam boundary causes TWO casts (expected, honest):**
* zod `patchSchema.modelMessages` is loose (`z.array(z.unknown())`) — the precise gate is the Convex `v.array(ModelMessage)` on the `patch` mutation, one hop downstream. So `http.ts` needs `result.data.modelMessages as Infer<typeof ModelMessage>[]` (prefer `Infer<...>` over `as any` — keeps the precise type flowing). Removing the old `as Id<"messages">` cast left `Id` import unused in `http.ts` (lint warning — drop the import).
* Reading stored data BACK into the strict SDK type needs casts too. `messages.flatMap(...)` unifies ONE element type across both branches; the branches differ (`{role:"assistant"|"tool", content:Part[]}` vs `{role:"user"|"assistant", content:string}`), so an OUTER `as ModelMessage[]` fails — flatMap's callback type-checks BEFORE the outer cast. Fix: cast INSIDE each branch — `if` → `message.modelMessages as unknown as ModelMessage[]` (double-hop: Convex's `JsonifyObject` wrapper is too far from SDK type for a direct assertion); `else` → `{ role, content } as ModelMessage`. Import the SDK `ModelMessage` type from `"ai"` (NOT the Convex validator — that's a runtime value).

**Verification (both passed):**
* Plain follow-up turn: `toolNames: []` — no re-fire of prior commands (core Bug-2 symptom gone), and turn succeeded ⇒ replayed `thoughtSignature` accepted (no gateway 400).
* Multi-tool stress (turn 1 = "make 3 todos", turn 2 = "delete the dentist one"): `toolNames: ["listTodos","removeTodo"]` — **no `createTodo` re-fire**, model resolved a cross-turn reference ("the dentist one") proving turn-1 context is in replayed history, and multi-signature replay caused no 400. NOTE: the `listTodos` call is the SYSTEM PROMPT obeying ("call listTodos first to resolve ids"), NOT a replay failure — the real proof is the absence of `createTodo` + coherent cross-turn reference. **KEEP the "always listTodos first" instruction — it is a deliberate staleness/scope guard, NOT an optimization target.** Replayed history is a stale, conversation-scoped snapshot; `listTodos` is fresh, global DB truth. Relaxing it would break: (a) todos created outside this conversation (web UI / other convo) — never in history; (b) todos that fell out of `fetch`'s `.take(200)` window; (c) todos edited/completed/deleted by another reactive client since they were last seen — history would hand the model a stale or dead ID. The two mechanisms are complementary: structured history = "what did I already do" (kills re-fires + preserves `thoughtSignature` continuity); `listTodos` = "what's true right now" (authoritative IDs before any mutation).
* `npm run lint` (0 errors, warnings only) + `npm run build` both green.

### 14. Chat UI BUILT — `/chat` route, persistent sidebar, ai-elements pane (lint+build green; NOT run live yet)
Routed chat interface (decision: URL path segment `/chat/[conversationId]`, NOT lifted state or nuqs — nuqs is for query-string state, the active convo is a path segment read via `useParams()`).

**Route structure (App Router, persistent layout):**
* `app/chat/layout.tsx` — server component; renders `<ChatSidebar/>` + `{children}` side-by-side. Frame is `flex h-dvh w-full overflow-hidden` so the chat has a BOUNDED height to scroll within (critical — without a fixed height the ai-elements StickToBottom can't scroll internally). Persists across navigation → sidebar never remounts.
* `app/chat/page.tsx` — empty state ("Select a conversation…").
* `app/chat/[conversationId]/page.tsx` — server component, `params` is a **Promise** (this Next version), `await params`, cast `conversationId as Id<"conversations">` at the seam, render `<ChatPane/>`.

**`features/ai/components/chat-sidebar.tsx`** (`"use client"`):
* `usePaginatedQuery(api.conversations.list, isAuthenticated ? {} : "skip", { initialNumItems: 30 })`. Pass `{}` (NOT `paginationOpts` — the hook injects it).
* **AUTH-GATE GOTCHA (hit twice):** `useConvexAuth()` returns an OBJECT `{ isAuthenticated }` — must DESTRUCTURE. `const isAuthenticated = useConvexAuth()` silently defeats the `"skip"` (object is always truthy) → cold-load `Unauthenticated` race (Phase-4 #4). Only a HARD REFRESH exposes it, not soft nav.
* Active highlight: `useParams().conversationId === c._id` → `secondary` vs `ghost`. New conversation: `create()` → `router.push(/chat/${id})` (reactive query pops it into the list). Load more on `status === "CanLoadMore"`.

**`features/ai/components/chat-pane.tsx`** (`"use client"`) — ai-elements used HEADLESS:
* ai-elements (`Conversation`/`Message`/`PromptInput`) installed shadcn-style into `components/ai-elements/` via `npx ai-elements@latest add conversation message prompt-input`. **KEY:** ai-elements examples all assume `useChat` from `@ai-sdk/react` (gives `parts[]` + `sendMessage`). We do NOT use useChat — Convex `useQuery` is the data source and `content` is a plain STRING → pass straight to `<MessageResponse>{content}</MessageResponse>`, no parts loop. (Good interview beat: "ai-elements is built around the AI SDK's useChat streaming model; I kept my Convex-reactive layer and used the components as pure presentation.")
* **`isGenerating` derived REACTIVELY** from message statuses (`some(m => m.role==="assistant" && (pending||streaming))`), NOT a manual `isSubmitting` — flips false on its own when Inngest patches to `done`. Drives the submit spinner + disabled state.
* `PromptInput` is UNCONTROLLED — reads text from its own `<textarea name="message">` via FormData and self-resets; so NO `value`/`setValue` state, read `message.text` in `onSubmit`. Kept the `send()` → `ky.post("/api/chat")` flow identical. Composition: `PromptInput > PromptInputBody > PromptInputTextarea` + `PromptInputFooter > PromptInputSubmit` (InputGroup lays it out; no absolute positioning needed in this version).
* Pending assistant bubble (empty content) → `TypingDots` (local 3-dot bounce); `status==="error"` → inline error line.
* Pane root `flex min-h-0 flex-1 flex-col` so `Conversation` scrolls internally (the `min-h-0` is required for a flex child to scroll instead of growing).

**`messages.list` is now `order("asc")`** (was desc) so the pane maps directly with no client reverse. Known limitation (fine for portfolio): `asc.take(200)` = OLDEST 200; a 200+ msg convo would pin to the start. Production fix = desc + reverse-paginate from newest on scroll-up.

**Cleanup:** deleted the throwaway `features/ai/components/ai-chat.tsx` POC and removed its import from `app/test/page.tsx` (the dangling import was breaking the build). lint 0 errors (warnings only, all in vendored ai-elements / generated files), `npm run build` green.

**LIVE-VERIFIED:** reactive round-trip, scroll-stick, markdown, sidebar highlight/pop-in, hard-refresh auth-gate all confirmed. Added a **3rd column** (`app/chat/layout.tsx`): reused `TodoInput`/`TodoList` over the SAME `api.todos.list` query the AI tools mutate ⇒ asking the assistant to edit todos repaints the panel with zero extra wiring (the Convex-reactivity payoff). Layout: `w-80 shrink-0 border-l`, pinned input, only the list scrolls (`flex-1 min-h-0 overflow-y-auto`). `TodoList` already self-gates auth (`useConvexAuth` destructure + `"skip"`) so no new cold-load race.

### 15. AI-generated conversation titles (Phase-7 step 5, DONE + live-verified)
* **Where:** a `step.run("generate-title")` in `inngest/functions.ts` placed AFTER `patch-convex`, so it never delays the visible reply.
* **First-turn gate:** `const isFirstTurn = !messages.some(m => m.role === "assistant")` against the PRE-turn `done`-history snapshot — sturdier than counting user rows (independent of what status `messages.send` stamps) and stays correct even though read post-generation. Only generate on the opening turn; later turns skip (no step created).
* **Generation:** `generateText` with `prompt: firstMessage.content` (one-shot — no hand-built message array; sidesteps role-typing) + a tight system prompt (≤5 words, no quotes), `title = r.text.trim()`. `generate` + `updateTitle` both run INSIDE the one step so only the plain string crosses the boundary (avoids the #10 getter trap).
* **Write path:** public `conversations.updateTitle` (auth + org-ownership) via the already-authed `ConvexHttpClient` + forwarded JWT (#1) — no 2nd internal HTTP bridge. Sidebar `conversations.list` repaints the new title reactively.

### 16. Delete conversations (DONE + live-verified)
* **Mutation `conversations.remove`:** same auth + org-ownership shape as `updateTitle`. **Manual cascade** (Convex has no auto-cascade): query `messages` via `by_conversation_status` (prefix on `conversationId` only) → delete children → then delete the conversation. Mutation is atomic so partial failure rolls back. `returns: v.null()`.
* **Sidebar UI:** `AlertDialog` confirm + `Trash2`, revealed on row hover (`group`/`group-hover:visible`). **Active-delete redirect:** if the deleted id === `useParams().conversationId`, `router.push("/chat")` — else the pane stays mounted on a dead id and `messages.list` throws "Conversation not found."
* **shadcn gotcha (the real lesson):** `<Button asChild>` uses Radix Slot = exactly ONE child; a row of `[Link, AlertDialog]` breaks it, and `<button>` inside `<a>` is invalid nesting anyway. Fix: row is a plain `<div>` styled with **`buttonVariants({variant})`** (the class-only helper shadcn exports), Link + AlertDialog as siblings, Link gets `flex-1 min-w-0` (min-w-0 is required for `truncate` inside flex), trash `Button size="icon"`.

### Convex API note (corrected — training data was stale)
* This Convex version has BOTH `ctx.db.patch(id, value)` AND a `ctx.db.patch(table, id, value)` overload (same for `get`/`delete`) — confirmed in `node_modules/convex/.../database.d.ts`. The table-name-first form is valid here. Don't "correct" it back to the 2-arg form.

---

## Phase 7 TODO (pick up here)

### Done
* Bug 1 (multi-step + model swap) — see resolution #9.
* Bug 2 soft fix — see resolution #11.
* **Bug 2 STRUCTURAL fix — DONE + verified — see resolution #13.** All 6 steps from #12 shipped; lint+build green; plain follow-up and multi-tool stress case both pass (no tool re-fire, no Gemini 400 on replayed `thoughtSignature`).

### DONE since last session
* **Bug 2 structural fix** — see #13.
* **Chat UI (route + sidebar + ai-elements pane)** — see #14. lint+build green.

### DONE this session
1. **Chat UI live-verified** + reactive todo panel added (3rd column) — see #14.
2. **AI titles** — see #15. **Delete conversations** — see #16 (not originally planned; closed a real CRUD gap).
3. **lint + build green.**

### START HERE (next session)
* **COMMIT + PR.** Committing now as 3 subsystem commits (per-feature atomic blocked: titles share `inngest/functions.ts` with the #13 fix and `convex/conversations.ts` with delete; sidebar shares with delete — and this env can't do interactive `git add -p`):
  1. `feat(ai): chat backend — todo tools, structured message history, AI titles` (convex/validators,schema,messages,conversations,http,todos + lib/schema + inngest/* + app/api/chat + package*).
  2. `feat(chat): chat interface — route, sidebar w/ delete, pane, todo panel` (app/chat, components/ai-elements, features/ai/components/*, features/todos/components/todo-item, app/test/page, del ai-chat.tsx).
  3. `docs: update plan and memory for phase 7` (AGENTS.md, IMPLEMENTATION_PLAN.md, memory.md).
* Then open PR `07-ai-chat-interface` → `main`, and move to **Phase 8 (`08-ai-background-jobs`)**: Inngest-triggered todo auto-categorization + recurring daily summary.

### Deferred
* (Optional / article-tracked) **Path B durability:** make Inngest own the tool loop (resolution #9 note). Still deferred.

---

## Working Preferences
* **Conceptual mode by default.** This is a portfolio project for a job hunt — what matters is being able to explain the architecture and defend tradeoffs in interviews, not raw line-count. Provide guidance, name patterns, point at the right APIs; let the user write the code. Give code snippets only when explicitly asked ("show me how to...").

## Memory Usage
* Use `memory.md` in the repo root (this file) — not the external Claude memory directory.
