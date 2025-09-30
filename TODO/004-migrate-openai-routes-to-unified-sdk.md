# Story 004 — OpenAI Routes: Migrate to Unified Vercel AI SDK

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [x] Done (delete this story file after completion)

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

Intent
Migrate all OpenAI-specific API routes to use the centralized Vercel AI SDK provider layer instead of direct OpenAI SDK calls. This standardizes provider usage and enables eventual removal of the openai directory.

Scope and guardrails
- Modify all routes under `apps/x-reason-web/src/app/api/openai/`
- Use centralized provider models from `providers.ts`
- Maintain existing request/response contracts for UI compatibility
- No changes to consuming components or contexts

What to do
- Identify all route handlers under `apps/x-reason-web/src/app/api/openai/`
- For each route:
  - Replace direct OpenAI SDK imports with Vercel AI SDK primitives
  - Import models from centralized providers module
  - Update streaming logic to use Vercel AI SDK helpers
  - Preserve existing error handling
- Update any route-specific utilities to use unified SDK
- Test each route with its existing consumer (UI component or context)

Acceptance criteria (what success looks like)
- No direct OpenAI SDK imports remain in `/api/openai/` routes
- All routes use models from centralized providers module
- Existing UI functionality works identically
- Request/response shapes unchanged
- TypeScript compiles without errors
- All affected routes tested manually

Lightweight tests to add (1–2 minimum)
- Unit (Jest):
  - Test 1: For primary OpenAI route, verify it imports from providers module not direct SDK
  - Test 2: Mock request to migrated route, verify response structure matches expected shape

Steps to implement
1) List all routes under `apps/x-reason-web/src/app/api/openai/`
2) For each route, refactor to use Vercel AI SDK
3) Update imports to use centralized providers
4) Test each route with `pnpm dev` and manual verification
5) Add unit tests for critical routes
6) Verify `pnpm test && pnpm build` succeed
7) Commit

No-regression verification
- Run:
  - `pnpm lint && pnpm test && pnpm build`
- Manual:
  - `pnpm dev` then test all OpenAI-dependent features

Out of scope
- Deletion of `/api/openai/` directory (Story 010)
- Migration of Gemini routes (Story 005)
- Changes to client components

Estimate
M

Links
- `/Users/anandpant/Development/x-reason/apps/x-reason-web/src/app/api/openai/`
- `/Users/anandpant/Development/x-reason/apps/x-reason-web/src/app/api/ai/providers.ts`