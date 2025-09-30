# Story 007 — Server Helpers: Update to Use Unified Provider Module

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [x] Done (delete this story file after completion)

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

Intent
Update all server-side utilities, actions, and library code to use the centralized Vercel AI SDK provider module instead of direct provider SDKs. This ensures consistency across all server-side AI operations.

Scope and guardrails
- Modify files in `apps/x-reason-web/src/app/actions/`, `.../lib/`, and `.../utils/`
- Focus only on AI provider-related code
- No changes to client-side utilities
- Maintain existing function signatures where possible

What to do
- Search for direct provider SDK imports in:
  - `apps/x-reason-web/src/app/actions/`
  - `apps/x-reason-web/src/app/lib/`
  - `apps/x-reason-web/src/app/utils/`
- Replace with imports from centralized providers module
- Update any AI model instantiation to use unified SDK
- Preserve existing helper function logic and contracts
- Test affected server actions and utilities

Acceptance criteria (what success looks like)
- No direct OpenAI or Gemini SDK imports in actions/lib/utils
- All AI operations use centralized provider models
- Existing helper function signatures unchanged (or minimally changed)
- All consuming code continues to work
- TypeScript compiles without errors

Lightweight tests to add (1–2 minimum)
- Unit (Jest):
  - Test 1: Verify server actions import from providers module, not direct SDKs
  - Test 2: Test a key helper function with mocked provider, verify it calls unified SDK correctly

Steps to implement
1) Search for provider SDK imports in actions/lib/utils directories
2) For each file with provider usage:
   - Replace imports with centralized provider module
   - Update model instantiation if needed
   - Test affected functionality
3) Run `pnpm test` to verify no regressions
4) Add unit tests for critical helpers
5) Verify `pnpm build` succeeds
6) Commit

No-regression verification
- Run:
  - `pnpm lint && pnpm test && pnpm build`
- Manual:
  - `pnpm dev` then test features using server actions (Chemli, Regie)

Out of scope
- Client-side utility changes
- Non-AI-related helpers
- State machine macro logic (unless provider-related)

Estimate
S

Links
- `/Users/anandpant/Development/x-reason/apps/x-reason-web/src/app/actions/`
- `/Users/anandpant/Development/x-reason/apps/x-reason-web/src/app/lib/`
- `/Users/anandpant/Development/x-reason/apps/x-reason-web/src/app/utils/`
- `/Users/anandpant/Development/x-reason/apps/x-reason-web/src/app/api/ai/providers.ts`