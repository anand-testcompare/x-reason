# Story 012 — Cleanup: Remove Unused Imports and Dead Code

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [x] Done (delete this story file after completion)

Completion Notes:
- Ran pnpm lint - no unused imports found
- All provider-related imports use centralized providers.ts
- Removed CredentialsModal from exports in components/index.ts
- Lint passes with 0 errors (only pre-existing warnings about any types)
- Build succeeds without issues

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

Intent
Remove unused imports, exports, and helper functions related to old provider SDKs after migration to Vercel AI SDK. This reduces bundle size and improves code maintainability.

Scope and guardrails
- Focus on provider-related dead code only
- Use linter and TypeScript to identify unused code
- Do NOT rely solely on knip for file removal (per project guidelines)
- Manual verification required before deleting any files

What to do
- Run `pnpm lint` to identify unused imports
- Search for unused exports referencing old providers in:
  - `apps/x-reason-web/src/app/actions/`
  - `apps/x-reason-web/src/app/lib/`
  - `apps/x-reason-web/src/app/utils/`
  - `apps/x-reason-web/src/app/components/`
- Remove imports of direct provider SDKs (OpenAI, Gemini)
- Update any stale type definitions or interfaces
- Fix ESLint warnings about unused variables
- Verify all remaining imports resolve correctly

Acceptance criteria (what success looks like)
- No unused imports related to old provider SDKs
- No unused exports of provider-specific helpers
- ESLint passes without unused variable warnings
- TypeScript compiles without errors
- Bundle size reduced (verify with `pnpm build`)

Lightweight tests to add (1–2 minimum)
- Unit (Jest):
  - Test 1: Static analysis test - verify no imports from old provider SDKs remain
  - Test 2: Verify build output size is smaller than baseline (if measurable)

Steps to implement
1) Run `pnpm lint` and document unused import warnings
2) Search for old provider SDK imports in codebase
3) Remove unused imports file by file
4) Remove unused exports and helper functions
5) Update stale type definitions
6) Run `pnpm lint` again to verify cleanup
7) Run `pnpm test && pnpm build` to verify no regressions
8) Commit

No-regression verification
- Run:
  - `pnpm lint && pnpm test && pnpm build`
- Manual:
  - `pnpm dev` then test all major features (Chemli, Regie)

Out of scope
- Non-provider-related dead code
- Large-scale refactoring
- Changes to component logic (only imports/exports)

Estimate
S

Links
- `/Users/anandpant/Development/x-reason/apps/x-reason-web/src/app/actions/`
- `/Users/anandpant/Development/x-reason/apps/x-reason-web/src/app/lib/`
- `/Users/anandpant/Development/x-reason/apps/x-reason-web/src/app/utils/`
- `/Users/anandpant/Development/x-reason/apps/x-reason-web/src/app/components/`