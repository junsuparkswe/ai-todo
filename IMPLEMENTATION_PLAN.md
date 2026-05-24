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

### Phase 3: Branch `03-convex` [DONE]
*   **Goal:** Implement Database & Core UI with Workspace Focus.
*   **User Tasks:**
    *   **Schema Definition**: [DONE] Defined `todos` with essential fields.
    *   **Security Logic**: [DONE] Implemented `orgId` verification.
    *   **CRUD**: [DONE] Wrote `create`, `get`, `list`, `toggle`, and `remove` functions.
    *   **UI Components**: [DONE] Built modularized `TodoInput`, `TodoList`, and `TodoItem` with a polished UI.
*   **Verification:** 
    *   [DONE] Full CRUD verified on `/test` page.
    *   [DONE] Privacy & Org isolation verified.

### Phase 4: Branch `04-inngest` [DONE]
*   **Goal:** Add Background Jobs.
*   **Verification:** [DONE] Setup Inngest server, registered background tasks, configured Clerk middleware bypass for /api/inngest, and handled unauthenticated query lifecycle.

### Phase 5: Branch `05-sentry` [DONE]
*   **Goal:** Add Application Monitoring.
*   **Verification:** [DONE] Sentry SDK integrated across client, server, and edge runtimes. Verified test error reports in the dashboard. Resolved Clerk middleware conflicts on the tunnel route `/monitoring`.

### Phase 6: Branch `06-ai-setup-command-bar`
*   **Goal:** Set up Vercel AI SDK and build AI Command Bar.
*   **User Tasks:**
    *   Register free Gemini API key on Google AI Studio.
    *   Configure Vercel AI SDK to support both Gemini (production/cloud) and swappable local Ollama models (via environment variables).
    *   Build natural language Command Bar to parse user commands (e.g. *"add buy milk tomorrow"*) using Gemini, executing Convex mutations on behalf of the user.
*   **Verification:** Commands parse correctly and write todos to Convex with appropriate metadata.

### Phase 7: Branch `07-ai-chat-assistant`
*   **Goal:** Build streaming AI Chat Assistant.
*   **User Tasks:**
    *   Create a sliding sidebar chat panel.
    *   Implement real-time token-by-token streaming UI using Vercel AI SDK.
    *   Equip the chat assistant with tools to query and mutate todos in Convex on behalf of the user.
*   **Verification:** User can chat with the assistant, see streaming responses, and ask the assistant to modify their todo list.

### Phase 8: Branch `08-ai-background-jobs`
*   **Goal:** Set up asynchronous AI background jobs with Inngest.
*   **User Tasks:**
    *   Configure an Inngest background job triggered on todo creation to auto-categorize the todo (e.g., "Work", "Personal") using Gemini and write it to Convex.
    *   Create a recurring daily summary job using Gemini to compile a report of completed/uncompleted todos.
*   **Verification:** Creating a todo triggers the categorization function in the background, updating its category metadata.

### Phase 9: Branch `09-ai-self-hosting`
*   **Goal:** Integrate local, self-hosted LLM (Ollama).
*   **User Tasks:**
    *   Install Ollama locally and run a model (like Llama 3 or Mistral).
    *   Set up local environment variables to route Vercel AI SDK queries to the local Ollama instance.
    *   Verify that the Command Bar and Chat Assistant functions work seamlessly with the self-hosted local model.
*   **Verification:** App successfully uses the local model without any changes to the core UI/logic code.

### Phase 10: Branch `10-automated-testing`
*   **Goal:** Add Vitest Unit Testing and Playwright E2E Testing.
*   **User Tasks:**
    *   Set up Vitest and write unit tests for critical Convex helper functions and schema validation.
    *   Set up Playwright and write E2E tests covering the Clerk auth redirect, core todo CRUD operations, and the AI command/chat integrations.
*   **Verification:** Tests pass locally and can be configured as a verification check in git branch management.


