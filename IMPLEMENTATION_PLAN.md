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

### Phase 2: Branch `02-clerk` [DONE]
*   **Goal:** Implement User Authentication.
*   **User Tasks:** Install SDK, set up middleware, add auth flows.
*   **Verification:** User can sign in/out. Protected routes enforced.

### Phase 2.5: Retroactive Testing (Clerk) [DONE]
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

### Phase 6: Branch `06-ai-setup-chat`
*   **Goal:** Set up Vercel AI SDK with Vercel AI Gateway and configure Inngest routing.
*   **User Tasks:**
    *   **[DONE]** Configure Vercel AI SDK to route model requests through Vercel AI Gateway using `AI_GATEWAY_API_KEY`, supporting swappable cloud providers (Google, OpenAI, Anthropic, etc.).
    *   **[DONE]** Define Convex schema for `conversations` and `messages`.
    *   **[DONE]** Implement Convex functions for `conversations.ts`.
    *   Implement Convex functions for `messages.ts` to handle streaming mutations.
    *   Set up Inngest event handlers to process AI chat inputs, buffer stream replies, and execute Convex mutations to patch message content.
*   **Verification:** Configuration handles a basic test event via Inngest, communicates with Vercel AI Gateway, and patches tokens into Convex successfully.

### Phase 7: Branch `07-ai-chat-interface`
*   **Goal:** Build a full Chat Window with Conversation History.
*   **User Tasks:**
    *   Build a dedicated Chat Interface that allows starting a new conversation and selecting/viewing past conversations.
    *   Connect the UI to Convex `useQuery` hooks to reactively stream tokens as they are patched by Inngest.
    *   Provide the AI Chat Assistant with tools (via Vercel AI SDK) to search, create, and toggle todos in Convex on behalf of the user, routed instantly via Inngest.
*   **Verification:** User can see past conversations, start new ones, chat with streaming responses (via Convex reactivity), and see their todo list mutate reactively when asking the assistant to make edits.

### Phase 8: Branch `08-ai-background-jobs`
*   **Goal:** Set up asynchronous AI background jobs with Inngest.
*   **User Tasks:**
    *   Configure an Inngest background job triggered on todo creation to auto-categorize the todo (e.g., "Work", "Personal") using the Gateway-configured models and write it to Convex.
    *   Create a recurring daily summary job using the Gateway-configured models to compile a report of completed/uncompleted todos.
*   **Verification:** Creating a todo triggers the categorization function in the background, updating its category metadata.

### Phase 9: Branch `09-ai-self-hosting`
*   **Goal:** Integrate local, self-hosted LLM and options menu.
*   **User Tasks:**
    *   Download, install, and host a free open-source model locally (e.g., via Ollama).
    *   Set up local environment variables and routing to connect the Vercel AI SDK to the self-hosted model.
    *   Build an options menu/settings UI to allow the user to manually switch the active model (between Vercel AI Gateway providers and the self-hosted local model).
    *   Verify that the Chat Interface functions work seamlessly with the selected model.
*   **Verification:** The application successfully switches models and functions correctly under both self-hosted and cloud Gateway environments.

### Phase 10: Branch `10-automated-testing`
*   **Goal:** Add Vitest Unit Testing and Playwright E2E Testing.
*   **User Tasks:**
    *   Set up Vitest and write unit tests for critical Convex helper functions and schema validation.
    *   Set up Playwright and write E2E tests covering the Clerk auth redirect, core todo CRUD operations, and the AI chat integrations.
*   **Verification:** Tests pass locally and can be configured as a verification check in git branch management.


