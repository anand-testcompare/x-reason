# Story 016 — Developer Ergonomics: Verify Monorepo Commands from Root

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [x] Done (delete this story file after completion)

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

Intent
Ensure all development commands (dev, build, start, test, lint) work correctly from the monorepo root after the Vercel AI SDK migration. This improves developer experience and ensures the monorepo workspace is properly configured.

Scope and guardrails
- Test commands from monorepo root only
- Fix any broken workspace commands
- No changes to application code
- Update package.json scripts if needed

What to do
- From repo root, verify each command works:
  - `pnpm dev` - should start Next.js dev server
  - `pnpm build` - should build all packages
  - `pnpm start` - should start production server
  - `pnpm test` - should run all tests
  - `pnpm lint` - should lint all packages
- Fix any broken workspace script references
- Ensure monorepo workspace configuration is correct
- Document any commands that must run from specific directories
- Verify output indicates which package is running

Acceptance criteria (what success looks like)
- All five commands run successfully from repo root
- Commands target correct packages in workspace
- Output clearly indicates which packages are affected
- No workspace configuration errors
- Scripts work consistently across fresh clones

Lightweight tests to add (1–2 minimum)
- Manual verification:
  - Test 1: Run all five commands from fresh clone, verify success
  - Test 2: Verify workspace commands target correct packages (check output)

Steps to implement
1) From repo root, run `pnpm dev` and verify it works
2) Run `pnpm build` and verify success
3) Run `pnpm start` and verify production server starts
4) Run `pnpm test` and verify all tests run
5) Run `pnpm lint` and verify linting works
6) Fix any broken commands in root package.json
7) Verify pnpm-workspace.yaml is correct
8) Document any edge cases in README
9) Commit if changes were needed

No-regression verification
- Run from repo root:
  - `pnpm lint && pnpm test && pnpm build`
- Verify:
  - `pnpm dev` starts server successfully

Out of scope
- Individual package commands (focus on root commands only)
- CI/CD workflow updates
- Docker or deployment command verification

Estimate
XS

Links
- `/Users/anandpant/Development/x-reason/package.json` (root)
- `/Users/anandpant/Development/x-reason/pnpm-workspace.yaml`
- `/Users/anandpant/Development/x-reason/apps/x-reason-web/package.json`