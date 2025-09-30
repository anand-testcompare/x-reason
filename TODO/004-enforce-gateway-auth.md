# Story 004 — Enforcement: Gateway-Only Authentication in providers.ts

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [ ] Done (delete this story file after completion)

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

## Intent

Enforce Gateway-only authentication by removing fallback chains to provider-specific API keys. This story makes `AI_GATEWAY_API_KEY` the ONLY accepted credential, throwing clear errors when it's missing.

## Scope and guardrails

- Modify only `apps/x-reason-web/src/app/api/ai/providers.ts`
- Remove fallback checks for OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, XAI_API_KEY
- Throw descriptive errors when AI_GATEWAY_API_KEY is missing
- Update any related utility functions or exports
- Ensure error messages guide users to correct configuration

## What to do

1. Remove all fallback logic from provider initialization:
   ```typescript
   // REMOVE THIS:
   const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY;

   // REPLACE WITH:
   const apiKey = process.env.AI_GATEWAY_API_KEY;
   if (!apiKey) {
     throw new Error(
       'AI_GATEWAY_API_KEY is required. Set it in .env.local. ' +
       'Provider-specific keys are no longer supported. ' +
       'See docs/ENV_CONFIG.md for setup instructions.'
     );
   }
   ```

2. Apply Gateway-only check to all provider creation functions:
   - `createOpenAIProvider`
   - `createGoogleProvider`
   - Any helper functions that initialize providers

3. Update error messages to include:
   - What's required: "AI_GATEWAY_API_KEY is required"
   - Where to set it: "in .env.local"
   - What's deprecated: "Provider-specific keys are no longer supported"
   - Where to find help: "See docs/ENV_CONFIG.md"

4. Remove any references to deprecated environment variable names from this file

5. Update JSDoc comments to reflect Gateway-only authentication

## Acceptance criteria (what success looks like)

- `AI_GATEWAY_API_KEY` is the ONLY environment variable checked for authentication
- Clear, actionable error thrown when `AI_GATEWAY_API_KEY` is missing
- No fallback chains to OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or XAI_API_KEY
- Error messages include documentation reference (docs/ENV_CONFIG.md)
- All provider creation functions enforce Gateway-only auth
- JSDoc comments accurately describe authentication requirements
- Attempting to use the app without AI_GATEWAY_API_KEY fails fast with clear guidance

## Lightweight tests to add (1–2 minimum)

- Unit test (Jest): Gateway-only authentication enforcement
  - Test 1: Verify provider creation succeeds with AI_GATEWAY_API_KEY set
  - Test 2: Verify provider creation throws descriptive error when AI_GATEWAY_API_KEY is missing

Add to: `apps/x-reason-web/src/app/test/providers-gateway.test.ts` (extend from Story 003)

```typescript
describe('providers.ts - Gateway-only enforcement', () => {
  it('should succeed with AI_GATEWAY_API_KEY', () => {
    process.env.AI_GATEWAY_API_KEY = 'gateway-key';
    delete process.env.OPENAI_API_KEY;

    expect(() => createOpenAIProvider()).not.toThrow();
  });

  it('should throw error when AI_GATEWAY_API_KEY is missing', () => {
    delete process.env.AI_GATEWAY_API_KEY;
    process.env.OPENAI_API_KEY = 'openai-key'; // Should NOT be used

    expect(() => createOpenAIProvider()).toThrow('AI_GATEWAY_API_KEY is required');
    expect(() => createOpenAIProvider()).toThrow('Provider-specific keys are no longer supported');
  });
});
```

## Steps to implement

1) Read `apps/x-reason-web/src/app/api/ai/providers.ts` (should already have Gateway support from Story 003)

2) Identify all locations where environment variables are read for authentication

3) Replace fallback chains with Gateway-only checks:
   - Remove `|| process.env.OPENAI_API_KEY` patterns
   - Remove `|| process.env.GOOGLE_GENERATIVE_AI_API_KEY` patterns
   - Remove `|| process.env.XAI_API_KEY` patterns

4) Add error throwing with descriptive message when AI_GATEWAY_API_KEY is missing

5) Update JSDoc comments to reflect Gateway-only authentication

6) Add 2 unit tests to `apps/x-reason-web/src/app/test/providers-gateway.test.ts`

7) Run tests: `pnpm test`

8) Verify error messages by temporarily unsetting AI_GATEWAY_API_KEY and running `pnpm dev`

## No-regression verification

- Run:
  - `pnpm lint` (should pass)
  - `pnpm test` (all tests should pass with AI_GATEWAY_API_KEY set in test environment)
  - `pnpm build` (should succeed)
- Manual:
  - Test with AI_GATEWAY_API_KEY set: `pnpm dev` should work
  - Test without AI_GATEWAY_API_KEY: should see clear error message on first API call
  - Test with only OPENAI_API_KEY: should NOT work, should see Gateway-required error

## Out of scope

- Updating .env.example (Story 006)
- Updating credential check route (Story 005)
- Updating other API routes (later stories)
- Adding XAI provider (Stories 010-011)
- Documentation updates (Story 019)

## Estimate

S (focused change to single file with clear requirements)

## Links

- `apps/x-reason-web/src/app/api/ai/providers.ts` - File to modify
- `apps/x-reason-web/src/app/test/providers-gateway.test.ts` - Test file
- `apps/x-reason-web/docs/ENV_CONFIG.md` - Referenced in error messages

## Dependencies

- Story 002 (ENV specification) - completed (for error message guidance)
- Story 003 (Gateway support in providers.ts) - completed (provides base for enforcement)

## Notes for implementer

This is a breaking change for developers who haven't migrated to Gateway. The error messages must be crystal clear and actionable. Test both success and failure paths thoroughly.