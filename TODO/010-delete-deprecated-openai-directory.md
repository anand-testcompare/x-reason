# Story 010 — Cleanup: Delete Deprecated OpenAI API Directory

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [x] Done (delete this story file after completion)

Completion Notes:
- Deleted /api/openai/ directory completely
- Verified no remaining imports to deleted directory
- All OpenAI operations now use centralized providers.ts
- Lint and build pass successfully

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

Intent
Remove the deprecated OpenAI API directory after successful migration to the unified Vercel AI SDK. This eliminates dead code and prevents accidental usage of old provider-specific routes.

Scope and guardrails
- Delete only after Story 004 is complete and verified
- Ensure no imports reference this directory before deletion
- Archive or document route mappings if needed

What to do
- Verify Story 004 (OpenAI routes migration) is complete
- Search codebase for any remaining imports from `/api/openai/`
- Document any route mappings for reference (old path -> new path)
- Delete `apps/x-reason-web/src/app/api/openai/` directory
- Remove any OpenAI-specific types or utilities if unused elsewhere
- Verify no broken imports remain

Acceptance criteria (what success looks like)
- `/api/openai/` directory is deleted
- No imports reference the deleted directory
- All tests pass
- Build succeeds
- No 404s for previously working routes (migrated routes work)

Lightweight tests to add (1–2 minimum)
- Unit (Jest):
  - Test 1: Verify no imports from `/api/openai/` in codebase (static analysis test)
  - Test 2: Test that unified provider routes work for former OpenAI endpoints

Steps to implement
1) Verify Story 004 completion and all OpenAI routes migrated
2) Search for imports from `/api/openai/` in codebase
3) Update any remaining imports to use unified routes
4) Document route mappings if needed
5) Delete `apps/x-reason-web/src/app/api/openai/` directory
6) Run `pnpm lint && pnpm test && pnpm build`
7) Test manually that all former OpenAI functionality works
8) Commit

No-regression verification
- Run:
  - `pnpm lint && pnpm test && pnpm build`
- Manual:
  - `pnpm dev` then test all features that previously used OpenAI routes

Out of scope
- Deletion of Gemini directory (Story 011)
- Provider SDK package removal (Story 001 already handled)

Estimate
XS

Links
- `/Users/anandpant/Development/x-reason/apps/x-reason-web/src/app/api/openai/` (to be deleted)
- Depends on: Story 004