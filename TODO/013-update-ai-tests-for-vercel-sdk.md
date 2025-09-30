# Story 013 — Tests: Update AI-Related Tests for Vercel AI SDK

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [x] Done (delete this story file after completion)

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

Intent
Update existing AI-related tests to reflect the new Vercel AI SDK provider layer and add new tests for migrated functionality. This ensures test coverage remains comprehensive after the migration.

Scope and guardrails
- Update tests in `apps/x-reason-web/src/app/test/` and inline test files
- Focus on AI provider, chat, and reasoning tests
- Use mocking to avoid live API calls in tests
- Maintain or improve existing test coverage

What to do
- Identify all tests that reference old provider SDKs
- Update mocks to match Vercel AI SDK API surface
- Add tests for centralized providers module
- Update chat API tests to reflect new streaming primitives
- Add tests for reasoning engine with unified SDK
- Ensure test timeout (120s) is appropriate for AI operations
- Mock provider responses for deterministic tests

Acceptance criteria (what success looks like)
- All AI-related tests pass with Vercel AI SDK
- No tests import or mock old provider SDKs
- New tests added for providers module
- Chat and reasoning tests updated for new streaming logic
- Test coverage maintained or improved
- All tests run in under 120s timeout

Lightweight tests to add (1–2 minimum)
- Unit (Jest):
  - Test 1: Test providers module exports correct models with expected structure
  - Test 2: Test chat API route with mocked streamText, verify correct response format

Steps to implement
1) List all AI-related tests in the codebase
2) Update tests to mock Vercel AI SDK instead of old SDKs
3) Add new tests for providers module
4) Update chat API tests for new streaming primitives
5) Update reasoning engine tests
6) Run `pnpm test` and fix failures
7) Verify all tests pass consistently
8) Commit

No-regression verification
- Run:
  - `pnpm lint && pnpm test && pnpm build`
- All tests should pass without warnings

Out of scope
- End-to-end tests (focus on unit tests)
- Performance testing
- Load testing with live APIs

Estimate
M

Links
- `/Users/anandpant/Development/x-reason/apps/x-reason-web/src/app/test/`
- `/Users/anandpant/Development/x-reason/apps/x-reason-web/src/app/api/ai/providers.ts`
- `/Users/anandpant/Development/x-reason/apps/x-reason-web/jest.config.js`