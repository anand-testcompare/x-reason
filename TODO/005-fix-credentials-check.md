# Story 005 — Fix: Update Credentials Check Route for GOOGLE_GENERATIVE_AI_API_KEY

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [ ] Done (delete this story file after completion)

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

## Intent

Fix the credential validation route to check the correct environment variable name for Google Gemini. Replace incorrect `GEMINI_API_KEY` reference with `GOOGLE_GENERATIVE_AI_API_KEY` to align with actual Vercel AI SDK conventions.

## Scope and guardrails

- Modify only `apps/x-reason-web/src/app/api/credentials/check/route.ts`
- This is a bug fix, not a full Gateway migration (Story 017 handles Gateway-only checks)
- Replace GEMINI_API_KEY with GOOGLE_GENERATIVE_AI_API_KEY
- Maintain existing API contract and response structure
- Keep backward compatibility with client code consuming this endpoint

## What to do

1. Read `apps/x-reason-web/src/app/api/credentials/check/route.ts` to understand current implementation

2. Find all references to `GEMINI_API_KEY` in the file

3. Replace with `GOOGLE_GENERATIVE_AI_API_KEY`:
   ```typescript
   // REPLACE:
   const hasGemini = !!process.env.GEMINI_API_KEY;

   // WITH:
   const hasGemini = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
   ```

4. Update any response field names if they reference "gemini" incorrectly:
   - If response uses `gemini_api_key` field, keep it (client may depend on it)
   - If response uses `GEMINI_API_KEY` field, consider changing to `GOOGLE_GENERATIVE_AI_API_KEY` (check client usage first)

5. Add a comment explaining the correct variable name:
   ```typescript
   // Vercel AI SDK uses GOOGLE_GENERATIVE_AI_API_KEY for Gemini
   const hasGemini = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
   ```

6. Ensure response JSON correctly indicates Gemini availability

## Acceptance criteria (what success looks like)

- `GEMINI_API_KEY` replaced with `GOOGLE_GENERATIVE_AI_API_KEY` throughout the file
- Credential check route correctly detects Google Gemini API key
- Response JSON accurately reflects Gemini credential availability
- Existing clients consuming this API continue to work
- No breaking changes to API contract (field names, response structure)
- Comment added documenting the correct environment variable name

## Lightweight tests to add (1–2 minimum)

- Unit test (Jest): Credential check route validation
  - Test 1: Verify route returns `hasGemini: true` when `GOOGLE_GENERATIVE_AI_API_KEY` is set
  - Test 2: Verify route returns `hasGemini: false` when `GOOGLE_GENERATIVE_AI_API_KEY` is missing

Add to: `apps/x-reason-web/src/app/test/credentials-check.test.ts` (new file)

```typescript
import { GET } from '@/app/api/credentials/check/route';

describe('credentials/check route', () => {
  it('should detect GOOGLE_GENERATIVE_AI_API_KEY', async () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-key';

    const response = await GET(new Request('http://localhost/api/credentials/check'));
    const data = await response.json();

    expect(data.hasGemini).toBe(true);
  });

  it('should return false when GOOGLE_GENERATIVE_AI_API_KEY is missing', async () => {
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    const response = await GET(new Request('http://localhost/api/credentials/check'));
    const data = await response.json();

    expect(data.hasGemini).toBe(false);
  });
});
```

## Steps to implement

1) Read `apps/x-reason-web/src/app/api/credentials/check/route.ts`

2) Search for all instances of `GEMINI_API_KEY`

3) Replace with `GOOGLE_GENERATIVE_AI_API_KEY`

4) Add explanatory comment about Vercel AI SDK convention

5) Create test file: `apps/x-reason-web/src/app/test/credentials-check.test.ts`

6) Add 2 unit tests as specified

7) Run tests: `pnpm test`

8) Verify API response manually:
   - Set `GOOGLE_GENERATIVE_AI_API_KEY` in `.env.local`
   - Start dev server: `pnpm dev`
   - Test endpoint: `curl http://localhost:3000/api/credentials/check`
   - Verify response shows Gemini as available

## No-regression verification

- Run:
  - `pnpm lint` (should pass)
  - `pnpm test` (all tests including new ones should pass)
  - `pnpm build` (should succeed)
- Manual:
  - `pnpm dev` then check credential detection at `/api/credentials/check`
  - Test with `GOOGLE_GENERATIVE_AI_API_KEY` set (should show available)
  - Test without it (should show unavailable)
  - Verify UI that uses this endpoint still works correctly

## Out of scope

- Migrating to Gateway-only authentication (Story 017)
- Checking for AI_GATEWAY_API_KEY (Story 017)
- Adding XAI provider checks (handled separately)
- Updating .env.example (Story 006)
- Changing API response structure or field names

## Estimate

XS (simple find-and-replace with test coverage)

## Links

- `apps/x-reason-web/src/app/api/credentials/check/route.ts` - File to modify
- `apps/x-reason-web/src/app/test/` - Test directory
- Vercel AI SDK Google provider docs

## Dependencies

None (this is an independent bug fix)

## Notes for implementer

This is a straightforward bug fix. The variable name was incorrect and didn't match the Vercel AI SDK's expected environment variable name. After this fix, Gemini credential detection should work correctly.