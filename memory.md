# Project Memory Log

## Current State
* **Framework:** Next.js (App Router, Turbopack)
* **Auth:** Clerk (configured with org-based multi-tenancy)
* **Database:** Convex (configured with schema and security rules)
* **Background Jobs:** Inngest (locally tested and serving endpoints)
* **Monitoring:** Sentry (configured across client, server, and edge runtimes with ad-blocker tunneling)
* **Status:** Phase 5 (`05-sentry`) is complete. Ready for next phase (AI Integration).

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

## Next Steps
* Create next branch (e.g., AI Integration / MCP Server).
* Check the updated `IMPLEMENTATION_PLAN.md` for specific details.
