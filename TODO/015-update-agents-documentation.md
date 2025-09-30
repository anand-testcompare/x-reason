# Story 015 — Documentation: Update AGENTS.md for New Architecture

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [x] Done (delete this story file after completion)

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

Intent
Update AGENTS.md to reflect how agents interact with the new Vercel AI SDK-based architecture. This ensures agent-specific documentation accurately describes the current system and guides future agent development.

Scope and guardrails
- Update AGENTS.md only; no code changes
- Focus on architectural changes affecting agents
- Document new provider abstraction layer
- Keep agent interaction patterns clear

What to do
- Update AGENTS.md to reflect:
  - Unified provider layer via Vercel AI SDK
  - Removal of direct provider SDK usage
  - Server-side-only API key configuration
  - Updated API route structure (no more `/api/openai/`, `/api/gemini/`)
  - Mock data availability for agent development
- Document how agents should interact with:
  - Centralized providers module
  - Streaming API routes
  - Reasoning engine endpoints
- Add notes on testing agents with mock data
- Remove any outdated provider-specific agent instructions

Acceptance criteria (what success looks like)
- AGENTS.md accurately reflects new architecture
- Agent interaction patterns clearly documented
- No references to deprecated API routes or direct SDKs
- Mock data usage for agent development explained
- Document follows existing style and structure

Lightweight tests to add (1–2 minimum)
- Manual verification:
  - Test 1: Review AGENTS.md for accuracy against current codebase
  - Test 2: Verify all referenced paths and APIs exist

Steps to implement
1) Review current AGENTS.md content
2) Identify outdated sections (provider-specific instructions)
3) Add section on unified Vercel AI SDK architecture
4) Update API route references (remove openai/gemini paths)
5) Document mock data usage for agents
6) Add examples of agent interaction with new providers
7) Review for consistency and clarity
8) Commit

No-regression verification
- Run:
  - `pnpm lint && pnpm test && pnpm build`
- Manual:
  - Review AGENTS.md for accuracy and completeness

Out of scope
- README.md updates (covered in Story 014)
- API-specific documentation (reasoning engine README)
- Tutorial or guide content beyond architecture overview

Estimate
S

Links
- `/Users/anandpant/Development/x-reason/AGENTS.md`
- `/Users/anandpant/Development/x-reason/apps/x-reason-web/src/app/api/ai/providers.ts`