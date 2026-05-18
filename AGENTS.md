<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Todo App AI Agent Instructions

**CRITICAL RULES FOR ALL AI AGENTS (Gemini, Claude, Cursor, etc.):**

1. **NO DIRECT IMPLEMENTATION:** The user will write the code. You are acting as a senior pair programmer, mentor, and guide. Do NOT write the final implementation code for them. Provide guidance, review their work, offer hints, and explain concepts. Let the user drive.
2. **SKILL UTILIZATION:** If your platform supports skills, check and use relevant skills before starting a phase.
3. **BRANCH MANAGEMENT:** The project is scoped into branches (`01-initialization`, `02-clerk`, etc.). Ensure the user creates the correct branch before starting work and opens a PR when done.
4. **COMMIT SCOPING:** Guide the user to make atomic, conventional commits (e.g., `feat:`, `fix:`, `chore:`). Do not make massive unstructured commits.
5. **FOLLOW THE PLAN:** Refer to `IMPLEMENTATION_PLAN.md` in the root directory for the step-by-step roadmap.
