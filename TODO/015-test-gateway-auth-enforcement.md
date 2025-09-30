# Story 015 — Testing: Add Unit Tests for Gateway-Only Authentication Enforcement

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [ ] Done (delete this story file after completion)

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

## Intent

Create comprehensive unit tests that verify Gateway-only authentication enforcement across all providers. Ensure that the system succeeds with AI_GATEWAY_API_KEY and fails clearly when it's missing, with no fallback to provider-specific keys.

## Scope and guardrails

- Create or extend test files for provider authentication
- Test all three providers: OpenAI, Google Gemini, XAI
- Verify success path with AI_GATEWAY_API_KEY
- Verify failure path without AI_GATEWAY_API_KEY (clear error messages)
- Verify provider-specific keys are NOT used as fallbacks
- Use Jest with mocking for environment variables
- Keep tests fast and deterministic

## What to do

1. Create or extend test file: `apps/x-reason-web/src/app/test/gateway-auth.test.ts`

2. Test success path - AI_GATEWAY_API_KEY present:
   ```typescript
   describe('Gateway authentication - success path', () => {
     beforeEach(() => {
       process.env.AI_GATEWAY_API_KEY = 'gateway-test-key';
       delete process.env.OPENAI_API_KEY;
       delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
     });

     it('should create OpenAI provider with Gateway key', () => {
       expect(() => createOpenAIProvider()).not.toThrow();
     });

     it('should create Gemini provider with Gateway key', () => {
       expect(() => createGoogleProvider()).not.toThrow();
     });

     it('should create XAI provider with Gateway key', () => {
       expect(() => createXAIProvider()).not.toThrow();
     });
   });
   ```

3. Test failure path - AI_GATEWAY_API_KEY missing:
   ```typescript
   describe('Gateway authentication - failure path', () => {
     beforeEach(() => {
       delete process.env.AI_GATEWAY_API_KEY;
     });

     it('should throw clear error when Gateway key missing', () => {
       expect(() => createOpenAIProvider()).toThrow('AI_GATEWAY_API_KEY is required');
       expect(() => createOpenAIProvider()).toThrow('See docs/ENV_CONFIG.md');
     });

     it('should NOT fall back to OPENAI_API_KEY', () => {
       process.env.OPENAI_API_KEY = 'openai-specific-key';
       expect(() => createOpenAIProvider()).toThrow('AI_GATEWAY_API_KEY is required');
     });

     it('should NOT fall back to GOOGLE_GENERATIVE_AI_API_KEY', () => {
       process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'gemini-specific-key';
       expect(() => createGoogleProvider()).toThrow('AI_GATEWAY_API_KEY is required');
     });
   });
   ```

4. Test error message clarity:
   ```typescript
   describe('Gateway authentication - error messages', () => {
     beforeEach(() => {
       delete process.env.AI_GATEWAY_API_KEY;
     });

     it('should include setup instructions in error', () => {
       try {
         createOpenAIProvider();
         fail('Should have thrown error');
       } catch (error) {
         expect(error.message).toContain('AI_GATEWAY_API_KEY');
         expect(error.message).toContain('.env.local');
         expect(error.message).toContain('docs/ENV_CONFIG.md');
       }
     });

     it('should explain deprecated keys are not supported', () => {
       process.env.OPENAI_API_KEY = 'old-key';
       try {
         createOpenAIProvider();
         fail('Should have thrown error');
       } catch (error) {
         expect(error.message).toContain('Provider-specific keys are no longer supported');
       }
     });
   });
   ```

5. Test baseURL configuration with Gateway:
   ```typescript
   describe('Gateway baseURL configuration', () => {
     beforeEach(() => {
       process.env.AI_GATEWAY_API_KEY = 'gateway-test-key';
     });

     it('should use AI_GATEWAY_BASE_URL when provided', () => {
       process.env.AI_GATEWAY_BASE_URL = 'https://custom-gateway.example.com';
       const provider = createOpenAIProvider();
       // Verify baseURL is configured (implementation-specific assertion)
     });

     it('should work without AI_GATEWAY_BASE_URL', () => {
       delete process.env.AI_GATEWAY_BASE_URL;
       expect(() => createOpenAIProvider()).not.toThrow();
     });
   });
   ```

## Acceptance criteria (what success looks like)

- Comprehensive test coverage for Gateway-only authentication
- All three providers (OpenAI, Gemini, XAI) tested for success with AI_GATEWAY_API_KEY
- All three providers tested for failure without AI_GATEWAY_API_KEY
- Tests verify NO fallback to provider-specific keys (OPENAI_API_KEY, etc.)
- Error messages tested for clarity and actionability
- Tests verify baseURL configuration works
- All tests pass: `pnpm test`
- Test coverage includes edge cases (missing keys, wrong keys, multiple keys set)
- Tests are fast and deterministic (no API calls)

## Lightweight tests to add (1–2 minimum)

This story IS about adding tests, so the tests are the deliverable. At minimum:
- Test 1: All providers succeed with AI_GATEWAY_API_KEY
- Test 2: All providers fail without AI_GATEWAY_API_KEY and don't fall back

(See "What to do" section for comprehensive test suite)

## Steps to implement

1) Create test file: `apps/x-reason-web/src/app/test/gateway-auth.test.ts`

2) Import provider creation functions from providers.ts

3) Implement success path tests (with AI_GATEWAY_API_KEY)

4) Implement failure path tests (without AI_GATEWAY_API_KEY)

5) Implement no-fallback tests (provider-specific keys ignored)

6) Implement error message clarity tests

7) Implement baseURL configuration tests

8) Run tests: `pnpm test`

9) Verify 100% pass rate

10) Check test coverage: `pnpm test --coverage` (optional)

## No-regression verification

- Run:
  - `pnpm lint` (should pass)
  - `pnpm test` (all tests including new ones should pass)
  - `pnpm build` (should succeed)
- Manual:
  - Verify tests cover all three providers
  - Check that tests fail if enforcement is removed (negative testing)
  - Ensure tests don't make real API calls

## Out of scope

- Integration tests with real AI Gateway API (use mocks)
- Performance testing or load testing
- End-to-end tests with full application stack
- Testing UI components (Story 013 handles UI tests)
- Testing API routes (other stories handle route-specific tests)

## Estimate

M (comprehensive test suite for critical authentication logic)

## Links

- `apps/x-reason-web/src/app/test/gateway-auth.test.ts` - File to create
- `apps/x-reason-web/src/app/api/ai/providers.ts` - Code under test

## Dependencies

- Story 004 (Gateway-only enforcement in providers.ts) - completed

## Notes for implementer

These tests are critical for ensuring the Gateway-only authentication policy is enforced correctly. Use `beforeEach` to reset environment variables and ensure test isolation. Mock any SDK initialization that might try to make network calls. The tests should be fast (< 100ms total) and deterministic.