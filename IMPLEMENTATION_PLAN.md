# Todo App Implementation Plan

## Objective
Build a Next.js Todo App integrating Clerk (Auth), Convex (Database), Inngest (Background Jobs), and Sentry (Monitoring). This project serves as a practice ground and portfolio piece for the user.

## CRITICAL AGENT INSTRUCTIONS
1. **NO DIRECT IMPLEMENTATION:** The user will write the code. You are acting as a senior pair programmer, mentor, and guide. Do not write the code for them. Provide guidance, review their work, offer hints, and explain concepts. Let the user drive the implementation.
2. **SKILL UTILIZATION:** Before starting a specific phase, check the available skills (e.g., `clerk-nextjs-patterns`, `next-best-practices`) and activate them if they provide relevant context for guiding the user.
3. **BRANCH MANAGEMENT:** Ensure the user strictly follows the defined branch strategy. Remind them to create the correct branch before starting work and to open a PR on GitHub when the branch is complete.
4. **COMMIT SCOPING:** Guide the user to make atomic, conventional commits (e.g., `feat:`, `fix:`, `chore:`).

## Branch Strategy & Implementation Steps

### Phase 1: Branch `01-initialization`
*   **Goal:** Clean up the existing Next.js boilerplate, prepare the foundation, and set up dark mode.
*   **User Tasks:**
    *   Clean up `app/page.tsx` and `app/globals.css`.
    *   Set up a basic application shell/layout.
    *   Ensure `shadcn/ui` is ready for use.
    *   **Implement Dark Mode:** Install and configure `next-themes`, and add a theme toggle component to the layout.
*   **Verification:** App runs without errors, shows a clean UI, and dark mode toggles successfully. Commit changes.

### Phase 2: Branch `02-clerk`
*   **Goal:** Implement User Authentication.
*   **User Tasks:**
    *   Install Clerk Next.js SDK.
    *   Set up Clerk environment variables.
    *   Configure `middleware.ts` to protect routes.
    *   Add `<UserButton />` and `<SignIn />` / `<SignUp />` flows.
*   **Verification:** User can sign in, sign out, and protected routes are enforced.

### Phase 3: Branch `03-convex`
*   **Goal:** Implement Database & Core UI.
*   **User Tasks:**
    *   Install Convex.
    *   Set up the Clerk-Convex integration (JWT template) so Convex knows the authenticated user.
    *   Define the Convex schema for `todos` (text, isCompleted, userId).
    *   Write Convex queries (get todos) and mutations (add, toggle, delete).
    *   Build the Next.js UI components (TodoInput, TodoList, TodoItem) alongside the data fetching.
*   **Verification:** User can perform full CRUD operations on their own todos, persisting to Convex.

### Phase 4: Branch `04-inngest`
*   **Goal:** Add Background Jobs.
*   **User Tasks:**
    *   Install Inngest.
    *   Set up the Inngest API route handler (`app/api/inngest/route.ts`).
    *   Implement 3 functions:
        1.  Cron job (e.g., scheduled cleanup of old tasks).
        2.  Email/Notification stub (e.g., triggered on specific todo actions).
        3.  AI Preparation function (an event-driven stub for future AI integrations).
*   **Verification:** Inngest dev server runs locally, and functions can be triggered via the UI or cron schedule.

### Phase 5: Branch `05-sentry`
*   **Goal:** Add Application Monitoring.
*   **User Tasks:**
    *   Initialize Sentry in the Next.js project.
    *   Configure filtering to ignore development noise.
    *   Test Sentry by manually throwing an error.
*   **Verification:** Errors are successfully caught and appear in the Sentry dashboard.
