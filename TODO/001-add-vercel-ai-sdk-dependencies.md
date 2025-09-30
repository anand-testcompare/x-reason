# Story 001 — Dependencies: Add Vercel AI SDK and Provider Adapters

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [x] Done (delete this story file after completion)

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

Intent
Add the Vercel AI SDK and required provider adapters to the project dependencies, replacing direct provider SDK usage. This establishes the foundation for unified AI provider abstraction and removes direct OpenAI/Gemini SDK dependencies.

Scope and guardrails
- Package changes only; no code modifications in this story
- Use pnpm for package management
- Keep provider adapters minimal (OpenAI and Google only)
- No changes to application code or API routes

What to do
- Add `ai` package to `apps/x-reason-web/package.json` (make sure you use the v5 w/ zod 4)
- Add `@ai-sdk/openai` for OpenAI provider support
- Add `@ai-sdk/google` for Google Gemini provider support
- Remove direct provider SDKs if present (e.g., `openai`, `@google/generative-ai`)
- Run `pnpm install` to update lockfile
- Verify no breaking changes to existing imports (they will be updated in subsequent stories)

Acceptance criteria (what success looks like)
- `ai`, `@ai-sdk/openai`, and `@ai-sdk/google` appear in dependencies
- Direct provider SDKs are removed from dependencies
- `pnpm install` completes successfully
- No runtime errors when running `pnpm dev` (existing code may still reference old imports, but app should start)

Lightweight tests to add (1–2 minimum)
- Unit (Jest):
  - Test 1: Verify package.json contains the three new dependencies in dependencies section
  - Test 2: Verify old provider SDKs are not in dependencies or devDependencies

Steps to implement
1) Open `apps/x-reason-web/package.json`
2) Add `ai`, `@ai-sdk/openai`, `@ai-sdk/google` to dependencies
3) Remove any direct provider SDKs (openai, @google/generative-ai, etc.)
4) Run `pnpm install` from repo root
5) Verify `pnpm dev` starts without install errors
6) Add unit test to verify package.json structure
7) Commit

No-regression verification
- Run:
  - `pnpm lint && pnpm test && pnpm build`
- Manual:
  - `pnpm dev` then check `http://localhost:3000`

Out of scope
- Code changes to use the new SDK (subsequent stories)
- Migration of existing API routes
- Updates to provider configuration logic

Estimate
XS

Links
- `/Users/anandpant/Development/x-reason/apps/x-reason-web/package.json`