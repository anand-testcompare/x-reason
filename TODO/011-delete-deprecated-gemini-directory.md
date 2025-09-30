# Story 011 — Cleanup: Delete Deprecated Gemini API Directory

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [x] Done (delete this story file after completion)

Completion Notes:
- Deleted /api/gemini/ directory completely
- Verified no remaining imports to deleted directory
- All Gemini operations now use centralized providers.ts
- Lint and build pass successfully

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

Intent
Remove the deprecated Gemini API directory after successful migration to the unified Vercel AI SDK. This completes the provider-specific directory cleanup and ensures all AI routes use the unified provider layer.

Scope and guardrails
- Delete only after Story 005 is complete and verified
- Ensure no imports reference this directory before deletion
- Archive or document route mappings if needed

What to do
- Verify Story 005 (Gemini routes migration) is complete
- Search codebase for any remaining imports from `/api/gemini/`
- Document any route mappings for reference (old path -> new path)
- Delete `apps/x-reason-web/src/app/api/gemini/` directory
- Remove any Gemini-specific types or utilities if unused elsewhere
- Verify no broken imports remain

Acceptance criteria (what success looks like)
- `/api/gemini/` directory is deleted
- No imports reference the deleted directory
- All tests pass
- Build succeeds
- No 404s for previously working routes (migrated routes work)

Lightweight tests to add (1–2 minimum)
- Unit (Jest):
  - Test 1: Verify no imports from `/api/gemini/` in codebase (static analysis test)
  - Test 2: Test that unified provider routes work for former Gemini endpoints

Steps to implement
1) Verify Story 005 completion and all Gemini routes migrated
2) Search for imports from `/api/gemini/` in codebase
3) Update any remaining imports to use unified routes
4) Document route mappings if needed
5) Delete `apps/x-reason-web/src/app/api/gemini/` directory
6) Run `pnpm lint && pnpm test && pnpm build`
7) Test manually that all former Gemini functionality works
8) Commit

No-regression verification
- Run:
  - `pnpm lint && pnpm test && pnpm build`
- Manual:
  - `pnpm dev` then test all features that previously used Gemini routes

Out of scope
- Further import cleanup (covered in Story 012)
- Provider SDK package removal (Story 001 already handled)

Estimate
XS

Links
- `/Users/anandpant/Development/x-reason/apps/x-reason-web/src/app/api/gemini/` (to be deleted)
- Depends on: Story 005