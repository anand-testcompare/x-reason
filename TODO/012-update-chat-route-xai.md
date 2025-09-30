# Story 012 — API Route: Add XAI to Chat Route Valid Providers and Model Resolution

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [ ] Done (delete this story file after completion)

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

## Intent

Update the chat API route to accept 'xai' as a valid provider and ensure model resolution works correctly for XAI/Grok models. This enables clients to use XAI through the streaming chat endpoint.

## Scope and guardrails

- Modify only `apps/x-reason-web/src/app/api/ai/chat/route.ts`
- Add 'xai' to valid provider list
- Ensure model resolution handles XAI models correctly
- Maintain streaming functionality for XAI
- Preserve existing OpenAI and Gemini functionality (no breaking changes)
- Keep error handling consistent with existing providers

## What to do

1. Read `apps/x-reason-web/src/app/api/ai/chat/route.ts` to understand current structure

2. Locate the valid provider list/validation:
   ```typescript
   const VALID_PROVIDERS = ['openai', 'google'];
   ```

3. Add 'xai' to valid providers:
   ```typescript
   const VALID_PROVIDERS = ['openai', 'google', 'xai'];
   ```

4. Update provider validation logic to accept 'xai':
   ```typescript
   if (!VALID_PROVIDERS.includes(provider)) {
     return new Response(
       JSON.stringify({
         error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}`
       }),
       { status: 400 }
     );
   }
   ```

5. Ensure model resolution handles XAI:
   ```typescript
   const modelToUse = model || getDefaultModel(provider);
   ```
   - Verify `getDefaultModel()` function supports 'xai' provider
   - Add case for 'xai' if needed:
     ```typescript
     function getDefaultModel(provider: string): string {
       switch (provider) {
         case 'openai': return DEFAULT_OPENAI_MODEL;
         case 'google': return DEFAULT_GEMINI_MODEL;
         case 'xai': return DEFAULT_XAI_MODEL;
         default: throw new Error(`Unknown provider: ${provider}`);
       }
     }
     ```

6. Verify streaming configuration works with XAI:
   - XAI uses OpenAI-compatible API, so streaming should work via Vercel AI SDK's `streamText()`

7. Update error messages to include 'xai' in examples

8. Add JSDoc comment documenting XAI support

## Acceptance criteria (what success looks like)

- 'xai' added to valid provider list
- Provider validation accepts 'xai' without errors
- Model resolution returns appropriate default for XAI when model not specified
- Explicit model selection works for XAI (e.g., `provider=xai&model=grok-beta`)
- Streaming functionality works with XAI provider
- Error messages updated to include 'xai' in valid provider examples
- Existing OpenAI and Gemini functionality unaffected
- Type safety maintained (TypeScript enforces valid providers)

## Lightweight tests to add (1–2 minimum)

- Unit test (Jest): Chat route XAI provider support
  - Test 1: Verify route accepts 'xai' provider without 400 error
  - Test 2: Verify default XAI model is used when model not specified

Add to: `apps/x-reason-web/src/app/test/chat-route-xai.test.ts` (new file)

```typescript
import { POST } from '@/app/api/ai/chat/route';

describe('chat route - XAI support', () => {
  beforeEach(() => {
    process.env.AI_GATEWAY_API_KEY = 'test-gateway-key';
  });

  it('should accept xai as valid provider', async () => {
    const request = new Request('http://localhost/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        provider: 'xai',
        messages: [{ role: 'user', content: 'Hello' }]
      })
    });

    const response = await POST(request);
    expect(response.status).not.toBe(400);
  });

  it('should use default XAI model when model not specified', async () => {
    const request = new Request('http://localhost/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        provider: 'xai',
        messages: [{ role: 'user', content: 'Hello' }]
      })
    });

    // Mock streamText to capture model parameter
    const streamTextSpy = jest.spyOn(require('ai'), 'streamText');

    await POST(request);

    expect(streamTextSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        model: expect.stringContaining('grok')
      })
    );
  });
});
```

## Steps to implement

1) Read `apps/x-reason-web/src/app/api/ai/chat/route.ts`

2) Locate valid provider list and add 'xai'

3) Update provider validation to accept 'xai'

4) Locate or create `getDefaultModel()` function and add XAI case

5) Verify streaming configuration works with XAI (should work via OpenAI compatibility)

6) Update error messages to include 'xai' in examples

7) Add JSDoc comment documenting XAI support

8) Create test file: `apps/x-reason-web/src/app/test/chat-route-xai.test.ts`

9) Add unit tests as specified

10) Run tests: `pnpm test`

11) Manual test:
    - Start dev server: `pnpm dev`
    - Test endpoint: `curl -X POST http://localhost:3000/api/ai/chat -H "Content-Type: application/json" -d '{"provider":"xai","messages":[{"role":"user","content":"Hello"}]}'`

## No-regression verification

- Run:
  - `pnpm lint` (should pass)
  - `pnpm test` (all tests including new XAI tests should pass)
  - `pnpm build` (should succeed)
- Manual:
  - Test existing providers still work: OpenAI and Gemini chat requests
  - Test XAI with default model: `{"provider":"xai","messages":[...]}`
  - Test XAI with explicit model: `{"provider":"xai","model":"grok-beta","messages":[...]}`
  - Verify streaming works for all providers

## Out of scope

- Modifying chat route request/response structure
- Adding XAI-specific parameters or configuration
- Implementing chat UI changes (Story 013)
- Adding other API routes (reasoning, etc.)

## Estimate

S (focused change to single API route)

## Links

- `apps/x-reason-web/src/app/api/ai/chat/route.ts` - File to modify
- `apps/x-reason-web/src/app/test/` - Test directory
- `apps/x-reason-web/src/app/api/ai/providers.ts` - Provider configuration

## Dependencies

- Story 010 (Add XAI provider) - completed
- Story 011 (XAI fast models) - completed

## Notes for implementer

The chat route likely uses `streamText()` from Vercel AI SDK. Since XAI is OpenAI-compatible, streaming should work automatically. Test with both default and explicit model selection. Ensure error messages are helpful and guide users to valid configurations.