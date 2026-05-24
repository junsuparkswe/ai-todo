# Todo App Implementation Plan

## Objective
Build a Next.js Todo App integrating Clerk (Auth), Convex (Database), Inngest (Background Jobs), and Sentry (Monitoring). This project serves as a practice ground and portfolio piece for the user. **Note:** Base functionality should be kept minimal to prioritize advanced features like AI Integration and an MCP Server for the user's job hunt.

## CRITICAL AGENT INSTRUCTIONS
1. **NO DIRECT IMPLEMENTATION:** The user will write the code. Do not write the code for them. Provide guidance, review work, and explain concepts.
2. **NO UNSOLICITED CODE:** Do not provide code examples unless explicitly asked (e.g., "Show me how to...").
3. **TESTING IS MANDATORY:** Every branch must include verification tests (manual or automated) before completion.
4. **FORCED MULTI-TENANCY:** Every todo must belong to an `orgId`. Clerk enforces organization membership for all users.

## Branch Strategy & Implementation Steps

### Phase 1: Branch `01-initialization`
*   **Goal:** Clean up boilerplate and set up UI foundation.
*   **Verification:** App runs without errors, dark mode works. Run `npm run lint` and `npm run build`.

### Phase 2: Branch `02-clerk`
*   **Goal:** Implement User Authentication.
*   **User Tasks:** Install SDK, set up middleware, add auth flows.
*   **Verification:** User can sign in/out. Protected routes enforced.

### Phase 2.5: Retroactive Testing (Clerk)
*   **Goal:** Add formal verification for the Auth implementation.
*   **User Tasks:** 
    *   Verify middleware redirects unauthenticated users.
    *   Test auth state persistence across reloads.
    *   Document the manual test cases for Auth.

### Phase 3: Branch `03-convex` (Current)
*   **Goal:** Implement Database & Core UI with Workspace Focus.
*   **User Tasks:**
    *   **Schema Definition**: [DONE] Defined `todos` with essential fields.
    *   **Security Logic**: [DONE] Implemented `orgId` verification.
    *   **CRUD**: [DONE] Wrote `create`, `get`, `list`, `toggle`, and `remove` functions.
    *   **UI Components**: Build `TodoInput`, `TodoList`, and `TodoItem`. **Refine the Todo Card UI and overall layout for a polished, "nice" look and feel.**
*   **Verification:** 
    *   Perform full CRUD.
    *   **Privacy Test**: Confirm User A cannot see User B's tasks.
    *   **Org Test**: Confirm User A cannot see tasks from Org B even if they are a member of Org A.

### Phase 4: Branch `04-inngest`
*   **Goal:** Add Background Jobs.
*   **Verification:** Inngest dev server runs, functions trigger via UI/cron.

### Phase 5: Branch `05-sentry`
*   **Goal:** Add Application Monitoring.
*   **Verification:** Errors appear in Sentry dashboard.
