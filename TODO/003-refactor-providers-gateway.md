# Story 003 — Core Refactor: Update providers.ts for Vercel AI Gateway Support

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [ ] Done (delete this story file after completion)

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

## Intent

Refactor the core AI provider abstraction to support Vercel AI Gateway authentication and base URL configuration. This enables unified credential management through `AI_GATEWAY_API_KEY` while maintaining support for OpenAI and Google Gemini providers.

## Scope and guardrails

- Modify only `apps/x-reason-web/src/app/api/ai/providers.ts`
- Add Gateway baseURL configuration for each provider
- Wire `AI_GATEWAY_API_KEY` as the authentication credential
- Do NOT enforce Gateway-only auth yet (Story 004 handles enforcement)
- Preserve existing provider interfaces and function signatures
- Maintain backward compatibility with existing code using this module

## What to do

1. Add Gateway baseURL constants for OpenAI and Google providers:
   ```typescript
   const GATEWAY_BASE_URL = 'https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_slug}';
   ```

2. Update provider creation functions to accept baseURL as optional parameter:
   - `createOpenAIProvider(apiKey: string, baseURL?: string)`
   - `createGoogleProvider(apiKey: string, baseURL?: string)`

3. Modify provider initialization to check for `AI_GATEWAY_API_KEY` first, then fall back to provider-specific keys (temporary, for gradual migration):
   ```typescript
   const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY;
   const baseURL = process.env.AI_GATEWAY_BASE_URL; // Optional
   ```

4. Pass baseURL to provider SDK initialization if provided:
   ```typescript
   openai.create({
     apiKey,
     baseURL: baseURL || undefined
   });
   ```

5. Add JSDoc comments documenting Gateway support and the migration path

6. Ensure type safety: baseURL should be optional string, not undefined

## Acceptance criteria (what success looks like)

- `providers.ts` accepts optional `baseURL` parameter for each provider
- `AI_GATEWAY_API_KEY` is checked before provider-specific keys (fallback chain works)
- Passing `AI_GATEWAY_BASE_URL` routes requests through Gateway
- Existing code using `providers.ts` continues to work without changes
- No breaking changes to function signatures or return types
- JSDoc comments document Gateway configuration
- Type definitions include baseURL as optional parameter

## Lightweight tests to add (1–2 minimum)

- Unit test (Jest): `providers.ts` Gateway support
  - Test 1: Verify `createOpenAIProvider` accepts baseURL parameter and passes it to SDK
  - Test 2: Verify `AI_GATEWAY_API_KEY` takes precedence over `OPENAI_API_KEY` when both are set

Add to: `apps/x-reason-web/src/app/test/providers-gateway.test.ts` (new file)

```typescript
describe('providers.ts - Gateway support', () => {
  it('should use AI_GATEWAY_API_KEY when available', () => {
    process.env.AI_GATEWAY_API_KEY = 'gateway-key';
    process.env.OPENAI_API_KEY = 'openai-key';

    const provider = createOpenAIProvider();
    // Assert provider uses gateway-key
  });

  it('should pass baseURL to provider SDK', () => {
    const baseURL = 'https://gateway.example.com';
    const provider = createOpenAIProvider('key', baseURL);
    // Assert baseURL is configured in provider
  });
});
```

## Steps to implement

1) Read `apps/x-reason-web/src/app/api/ai/providers.ts` to understand current structure

2) Add Gateway baseURL constants at the top of the file

3) Update provider creation functions to accept optional baseURL parameter

4) Modify environment variable precedence: check `AI_GATEWAY_API_KEY` first

5) Pass baseURL to SDK initialization when provided

6) Add JSDoc comments documenting Gateway support

7) Create test file: `apps/x-reason-web/src/app/test/providers-gateway.test.ts`

8) Write 2 unit tests as specified in "Lightweight tests" section

9) Run tests and verify they pass: `pnpm test`

## No-regression verification

- Run:
  - `pnpm lint` (should pass)
  - `pnpm test` (all tests including new ones should pass)
  - `pnpm build` (should succeed)
- Manual:
  - `pnpm dev` then verify existing AI functionality works at `http://localhost:3000`
  - Test with `AI_GATEWAY_API_KEY` set in `.env.local`
  - Test with only `OPENAI_API_KEY` set (fallback should work)

## Out of scope

- Enforcing Gateway-only authentication (Story 004)
- Removing provider-specific key fallbacks (Story 004)
- Updating .env.example (Story 006)
- Adding XAI provider (Stories 010-011)
- Updating other API routes (later stories)

## Estimate

M (requires careful refactoring with backward compatibility)

## Links

- `apps/x-reason-web/src/app/api/ai/providers.ts` - File to modify
- `apps/x-reason-web/src/app/test/` - Test directory
- Vercel AI Gateway docs: https://vercel.com/docs/ai-gateway

## Dependencies

- Story 001 (Audit) - completed
- Story 002 (ENV specification) - completed

## Notes for implementer

This is a critical refactor that touches the core provider abstraction. Test thoroughly with both Gateway and non-Gateway configurations. The fallback chain is temporary; Story 004 will enforce Gateway-only authentication.