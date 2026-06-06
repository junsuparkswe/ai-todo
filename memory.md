# Project Memory Log

## Current State
* **Framework:** Next.js (App Router, Turbopack)
* **Auth:** Clerk (configured with org-based multi-tenancy)
* **Database:** Convex (configured with schema and security rules)
* **Background Jobs:** Inngest (locally tested and serving endpoints)
* **Monitoring:** Sentry (configured across client, server, and edge runtimes with ad-blocker tunneling)
* **AI:** Vercel AI SDK v6 with Vercel AI Gateway (`@ai-sdk/google`, model string passed directly e.g. `"google/gemini-2.0-flash-lite"`)
* **Status:** Phase 6 (`06-ai-setup-chat`) in progress.

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
  * `GET /internal/fetch-conversation` — calls `internal.messages.fetch` (internalQuery, still to be implemented)

---

## Phase 6 Remaining Tasks
* Add `internalQuery` called `fetch` to `convex/messages.ts` (fetches messages by conversationId, no auth)
* Fix `GET /internal/fetch-conversation` in `convex/http.ts` to use query params instead of request body (GET requests don't have bodies)
* Fix `inngest/functions.ts` `fetch-conversation` step to pass conversationId as a query param, and call `.json()` on the ky response
* Fix `messages` array construction in `inngest/functions.ts` — spread previous messages array + append new user message object (not string concatenation)
* Update `app/api/chat/route.ts` to fire `app/chat.message.sent` with correct payload
* Verify end-to-end pipeline works

## Memory Usage
* Use `memory.md` in the repo root (this file) — not the external Claude memory directory.
