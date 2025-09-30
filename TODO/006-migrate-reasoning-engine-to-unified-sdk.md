# Story 006 — Reasoning Engine: Migrate to Unified Vercel AI SDK

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [x] Done (delete this story file after completion)

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

Intent
Update the reasoning engine and its streaming endpoints to use the centralized Vercel AI SDK provider layer. This ensures the core reasoning logic benefits from unified provider abstraction and consistent streaming patterns.

Scope and guardrails
- Modify routes under `apps/x-reason-web/src/app/api/reasoning/`
- Focus on streaming endpoints (e.g., `stream/route.ts`) and provider-dependent logic
- Maintain existing reasoning engine contracts and state machine integration
- No changes to XState machine generation logic unless provider-related

What to do
- Identify provider-dependent code in `apps/x-reason-web/src/app/api/reasoning/**`
- Update streaming endpoints to use Vercel AI SDK primitives
- Replace direct provider imports with centralized provider models
- Ensure reasoning prompts work with unified provider interface
- Update any provider-specific adapters or utilities
- Test with existing Chemli and Regie reasoning flows

Acceptance criteria (what success looks like)
- Reasoning engine uses centralized provider models
- Streaming responses work with Vercel AI SDK helpers
- No direct provider SDK imports in reasoning directory
- Chemli and Regie demos function identically
- State machine integration unaffected
- TypeScript compiles without errors

Lightweight tests to add (1–2 minimum)
- Unit (Jest):
  - Test 1: Verify reasoning stream endpoint imports from providers module
  - Test 2: Mock reasoning request, verify prompt format compatible with Vercel AI SDK

Steps to implement
1) Review all files under `apps/x-reason-web/src/app/api/reasoning/`
2) Identify provider-dependent code and streaming logic
3) Refactor to use centralized providers and Vercel AI SDK primitives
4) Update streaming endpoints (e.g., `stream/route.ts`)
5) Test Chemli and Regie reasoning flows manually
6) Add unit tests for critical reasoning paths
7) Verify `pnpm test && pnpm build` succeed
8) Commit

No-regression verification
- Run:
  - `pnpm lint && pnpm test && pnpm build`
- Manual:
  - `pnpm dev` then test Chemli and Regie reasoning demos

Out of scope
- Changes to XState machine generation logic (unless provider-related)
- UI component updates
- Reasoning prompt content changes (unless required for SDK compatibility)

Estimate
M

Links
- `/Users/anandpant/Development/x-reason/apps/x-reason-web/src/app/api/reasoning/`
- `/Users/anandpant/Development/x-reason/apps/x-reason-web/src/app/api/ai/providers.ts`
- `/Users/anandpant/Development/x-reason/apps/x-reason-web/src/app/api/reasoning/README.md`