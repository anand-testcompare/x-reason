# Story 010 — Provider: Add XAI Provider to providers.ts via Vercel AI SDK

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [ ] Done (delete this story file after completion)

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

## Intent

Add XAI (X.AI, formerly Twitter AI) as a new provider in the unified AI provider abstraction using Vercel AI SDK compatibility. Enable Grok model support through the Gateway-authenticated provider system.

## Scope and guardrails

- Modify only `apps/x-reason-web/src/app/api/ai/providers.ts`
- Add XAI provider using Vercel AI SDK's OpenAI-compatible interface
- Wire Gateway authentication (AI_GATEWAY_API_KEY only)
- Do NOT add expensive models (Grok-4 excluded, Story 011 specifies fast models only)
- Maintain consistency with existing OpenAI and Gemini provider patterns
- Keep provider interface uniform for easy switching

## What to do

1. Import XAI provider from Vercel AI SDK:
   ```typescript
   import { createOpenAI } from '@ai-sdk/openai'; // XAI is OpenAI-compatible
   ```

2. Define XAI provider type and models (placeholder, Story 011 specifies fast models):
   ```typescript
   export type XAIProvider = 'xai';
   export type XAIModel = 'grok-beta' | 'grok-vision-beta'; // Fast variants only
   ```

3. Create XAI provider factory function:
   ```typescript
   export function createXAIProvider(baseURL?: string) {
     const apiKey = process.env.AI_GATEWAY_API_KEY;
     if (!apiKey) {
       throw new Error(
         'AI_GATEWAY_API_KEY is required. Set it in .env.local. ' +
         'See docs/ENV_CONFIG.md for setup instructions.'
       );
     }

     return createOpenAI({
       apiKey,
       baseURL: baseURL || process.env.AI_GATEWAY_BASE_URL || 'https://api.x.ai/v1',
       compatibility: 'strict', // XAI follows OpenAI API spec
     });
   }
   ```

4. Add XAI to provider union types:
   ```typescript
   export type AIProvider = 'openai' | 'google' | 'xai';
   ```

5. Update provider resolution function to handle 'xai':
   ```typescript
   export function getProvider(provider: AIProvider, model?: string) {
     switch (provider) {
       case 'openai':
         return createOpenAIProvider();
       case 'google':
         return createGoogleProvider();
       case 'xai':
         return createXAIProvider();
       default:
         throw new Error(`Unknown provider: ${provider}`);
     }
   }
   ```

6. Add XAI model configuration (minimal for now, Story 011 expands):
   ```typescript
   export const XAI_MODELS = {
     'grok-beta': { name: 'Grok Beta', description: 'Fast Grok model' },
     'grok-vision-beta': { name: 'Grok Vision Beta', description: 'Fast vision model' },
   };

   export const DEFAULT_XAI_MODEL: XAIModel = 'grok-beta';
   ```

7. Add JSDoc comments documenting XAI provider setup and Gateway requirement

## Acceptance criteria (what success looks like)

- XAI provider added to `providers.ts` using Vercel AI SDK OpenAI compatibility
- `createXAIProvider()` function follows same pattern as OpenAI/Gemini providers
- Gateway authentication enforced (AI_GATEWAY_API_KEY required)
- XAI added to `AIProvider` union type
- Provider resolution function handles 'xai' case
- Minimal model configuration for XAI (fast models only)
- Default XAI model defined
- JSDoc comments document XAI setup
- Type safety: TypeScript enforces valid XAI models

## Lightweight tests to add (1–2 minimum)

- Unit test (Jest): XAI provider creation
  - Test 1: Verify `createXAIProvider()` succeeds with AI_GATEWAY_API_KEY
  - Test 2: Verify `getProvider('xai')` returns XAI provider instance

Add to: `apps/x-reason-web/src/app/test/providers-xai.test.ts` (new file)

```typescript
import { createXAIProvider, getProvider, XAI_MODELS, DEFAULT_XAI_MODEL } from '@/app/api/ai/providers';

describe('XAI provider', () => {
  beforeEach(() => {
    process.env.AI_GATEWAY_API_KEY = 'test-gateway-key';
  });

  it('should create XAI provider with Gateway auth', () => {
    expect(() => createXAIProvider()).not.toThrow();
  });

  it('should throw error when AI_GATEWAY_API_KEY is missing', () => {
    delete process.env.AI_GATEWAY_API_KEY;
    expect(() => createXAIProvider()).toThrow('AI_GATEWAY_API_KEY is required');
  });

  it('should resolve xai provider via getProvider', () => {
    const provider = getProvider('xai');
    expect(provider).toBeDefined();
  });

  it('should have valid default model', () => {
    expect(XAI_MODELS).toHaveProperty(DEFAULT_XAI_MODEL);
  });
});
```

## Steps to implement

1) Read `apps/x-reason-web/src/app/api/ai/providers.ts` to understand current structure

2) Add XAI provider imports (use OpenAI compatibility from Vercel AI SDK)

3) Define XAI types: `XAIProvider`, `XAIModel` (minimal fast models)

4) Implement `createXAIProvider()` function with Gateway auth

5) Add 'xai' to `AIProvider` union type

6) Update `getProvider()` switch statement to handle 'xai'

7) Add `XAI_MODELS` configuration object

8) Define `DEFAULT_XAI_MODEL` constant

9) Add JSDoc comments documenting XAI provider

10) Create test file: `apps/x-reason-web/src/app/test/providers-xai.test.ts`

11) Add unit tests as specified

12) Run tests: `pnpm test`

## No-regression verification

- Run:
  - `pnpm lint` (should pass)
  - `pnpm test` (all tests including new XAI tests should pass)
  - `pnpm build` (should succeed)
- Manual:
  - Verify existing OpenAI and Gemini providers still work
  - Type-check: `pnpm tsc --noEmit`

## Out of scope

- Adding expensive Grok-4 model (explicitly excluded)
- Expanding XAI model list beyond fast variants (Story 011)
- Updating chat route to accept 'xai' (Story 012)
- Updating UI provider selector (Story 013)
- Testing XAI provider with real API calls (unit tests use mocks)

## Estimate

M (new provider integration with testing)

## Links

- `apps/x-reason-web/src/app/api/ai/providers.ts` - File to modify
- `apps/x-reason-web/src/app/test/` - Test directory
- Vercel AI SDK OpenAI compatibility: https://sdk.vercel.ai/providers/ai-sdk-providers/openai
- XAI API documentation: https://docs.x.ai/

## Dependencies

- Story 003 (Gateway support in providers.ts) - completed
- Story 004 (Gateway-only enforcement) - completed

## Notes for implementer

XAI uses an OpenAI-compatible API, so we can leverage `createOpenAI` from Vercel AI SDK with a custom baseURL. Verify XAI's actual base URL from their documentation. Story 011 will add specific fast Grok model variants; for now, use placeholder model names that will be refined.