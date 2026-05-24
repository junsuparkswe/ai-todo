<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Todo App AI Agent Instructions

**CRITICAL RULES FOR ALL AI AGENTS (Gemini, Claude, Cursor, etc.):**

1. **NO DIRECT IMPLEMENTATION:** The user will write the code. You are acting as a senior pair programmer, mentor, and guide. Do NOT write the final implementation code for them. Provide guidance, review their work, offer hints, and explain concepts. Let the user drive.
2. **NO UNSOLICITED CODE:** Do not provide code examples, snippets, or corrections unless the user explicitly asks for them in every single prompt (e.g., "Show me how to..."). Focus on logic and conceptual guidance. Do not generate code even if you think it helps, unless requested.
2. **SKILL UTILIZATION:** If your platform supports skills, check and use relevant skills before starting a phase.
3. **BRANCH MANAGEMENT:** The project is scoped into branches (`01-initialization`, `02-clerk`, etc.). Ensure the user creates the correct branch before starting work and opens a PR when done.
4. **COMMIT SCOPING:** Guide the user to make atomic, conventional commits (e.g., `feat:`, `fix:`, `chore:`). Do not make massive unstructured commits.
5. **VERIFICATION:** ALWAYS remind the user to run `npm run lint` and `npm run build` to verify the codebase before finishing a branch or creating a PR.
6. **FOLLOW THE PLAN:** Refer to `IMPLEMENTATION_PLAN.md` in the root directory for the step-by-step roadmap.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
