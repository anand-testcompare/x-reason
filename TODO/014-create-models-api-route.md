# Story 014 — API Route: Create Models Metadata Endpoint

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [ ] Done (delete this story file after completion)

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

## Intent

Create a new API route that returns comprehensive metadata about all configured providers, available models, defaults, and environment-based availability flags. This enables dynamic UI updates and better client-side provider/model selection.

## Scope and guardrails

- Create new file: `apps/x-reason-web/src/app/api/ai/models/route.ts`
- Return structured JSON with providers, models, defaults, and availability
- Read configuration from providers.ts (single source of truth)
- Include environment-based flags (which providers are enabled via AI_GATEWAY_API_KEY)
- Keep response cacheable (static configuration + dynamic availability)
- No breaking changes to existing API routes

## What to do

1. Create new API route file: `apps/x-reason-web/src/app/api/ai/models/route.ts`

2. Implement GET handler that returns provider/model metadata:
   ```typescript
   import { NextResponse } from 'next/server';
   import {
     OPENAI_MODELS, DEFAULT_OPENAI_MODEL,
     GEMINI_MODELS, DEFAULT_GEMINI_MODEL,
     XAI_MODELS, DEFAULT_XAI_MODEL,
   } from '../providers';

   export async function GET() {
     const hasGatewayKey = !!process.env.AI_GATEWAY_API_KEY;

     const response = {
       providers: [
         {
           id: 'openai',
           name: 'OpenAI',
           enabled: hasGatewayKey,
           models: OPENAI_MODELS,
           defaultModel: DEFAULT_OPENAI_MODEL,
         },
         {
           id: 'google',
           name: 'Google Gemini',
           enabled: hasGatewayKey,
           models: GEMINI_MODELS,
           defaultModel: DEFAULT_GEMINI_MODEL,
         },
         {
           id: 'xai',
           name: 'X.AI (Grok)',
           enabled: hasGatewayKey,
           models: XAI_MODELS,
           defaultModel: DEFAULT_XAI_MODEL,
         },
       ],
       gatewayRequired: true,
       gatewayConfigured: hasGatewayKey,
     };

     return NextResponse.json(response);
   }
   ```

3. Add TypeScript types for response structure:
   ```typescript
   export interface ModelInfo {
     name: string;
     description: string;
     speed?: string;
     costTier?: string;
   }

   export interface ProviderInfo {
     id: string;
     name: string;
     enabled: boolean;
     models: Record<string, ModelInfo>;
     defaultModel: string;
   }

   export interface ModelsResponse {
     providers: ProviderInfo[];
     gatewayRequired: boolean;
     gatewayConfigured: boolean;
   }
   ```

4. Add cache headers for better performance:
   ```typescript
   return NextResponse.json(response, {
     headers: {
       'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
     },
   });
   ```

5. Add error handling for missing configuration:
   ```typescript
   try {
     // ... build response
   } catch (error) {
     return NextResponse.json(
       { error: 'Failed to load model configuration' },
       { status: 500 }
     );
   }
   ```

6. Add JSDoc comments documenting the endpoint

## Acceptance criteria (what success looks like)

- New API route exists at `/api/ai/models`
- GET request returns structured JSON with all providers and models
- Response includes enabled flags based on AI_GATEWAY_API_KEY presence
- Each provider includes: id, name, enabled status, models, default model
- Model metadata includes: name, description, speed, cost tier
- Response indicates Gateway requirement and configuration status
- Cache headers optimize performance
- Error handling provides clear failure messages
- TypeScript types exported for client-side consumption
- JSDoc comments document endpoint usage

## Lightweight tests to add (1–2 minimum)

- Unit test (Jest): Models API route
  - Test 1: Verify route returns all three providers with correct structure
  - Test 2: Verify enabled flags reflect AI_GATEWAY_API_KEY presence

Add to: `apps/x-reason-web/src/app/test/models-route.test.ts` (new file)

```typescript
import { GET } from '@/app/api/ai/models/route';

describe('models API route', () => {
  it('should return all providers with models', async () => {
    process.env.AI_GATEWAY_API_KEY = 'test-key';

    const response = await GET();
    const data = await response.json();

    expect(data.providers).toHaveLength(3);
    expect(data.providers[0]).toHaveProperty('id');
    expect(data.providers[0]).toHaveProperty('models');
    expect(data.providers[0]).toHaveProperty('defaultModel');
    expect(data.providers[0]).toHaveProperty('enabled');

    // Verify all three providers present
    const providerIds = data.providers.map(p => p.id);
    expect(providerIds).toContain('openai');
    expect(providerIds).toContain('google');
    expect(providerIds).toContain('xai');
  });

  it('should set enabled=false when AI_GATEWAY_API_KEY missing', async () => {
    delete process.env.AI_GATEWAY_API_KEY;

    const response = await GET();
    const data = await response.json();

    expect(data.gatewayConfigured).toBe(false);
    data.providers.forEach(provider => {
      expect(provider.enabled).toBe(false);
    });
  });

  it('should set enabled=true when AI_GATEWAY_API_KEY present', async () => {
    process.env.AI_GATEWAY_API_KEY = 'test-key';

    const response = await GET();
    const data = await response.json();

    expect(data.gatewayConfigured).toBe(true);
    data.providers.forEach(provider => {
      expect(provider.enabled).toBe(true);
    });
  });
});
```

## Steps to implement

1) Create new file: `apps/x-reason-web/src/app/api/ai/models/route.ts`

2) Import model configurations from providers.ts

3) Define TypeScript interfaces for response structure

4) Implement GET handler that builds provider/model metadata

5) Add environment-based enabled flags

6) Add cache headers for performance

7) Implement error handling

8) Add JSDoc comments

9) Export TypeScript types for client use

10) Create test file: `apps/x-reason-web/src/app/test/models-route.test.ts`

11) Add unit tests as specified

12) Run tests: `pnpm test`

13) Manual test:
    - `pnpm dev`
    - Test endpoint: `curl http://localhost:3000/api/ai/models`
    - Verify JSON structure and content

## No-regression verification

- Run:
  - `pnpm lint` (should pass)
  - `pnpm test` (all tests including new route tests should pass)
  - `pnpm build` (should succeed)
- Manual:
  - Test with AI_GATEWAY_API_KEY set: `curl http://localhost:3000/api/ai/models`
  - Test without AI_GATEWAY_API_KEY: verify enabled=false for all providers
  - Verify response structure matches TypeScript types
  - Check cache headers in browser DevTools

## Out of scope

- Implementing UI that consumes this endpoint (Story 013 handles UI updates)
- Adding real-time model availability checks (API health pings)
- Including pricing information or rate limits
- Model capability detection (vision, function calling, etc.)
- Authentication/authorization for endpoint

## Estimate

M (new API route with comprehensive metadata and testing)

## Links

- `apps/x-reason-web/src/app/api/ai/models/route.ts` - File to create
- `apps/x-reason-web/src/app/api/ai/providers.ts` - Configuration source
- `apps/x-reason-web/src/app/test/` - Test directory

## Dependencies

- Story 008 (OpenAI models) - completed
- Story 009 (Gemini models) - completed
- Story 010-011 (XAI provider and models) - completed

## Notes for implementer

This endpoint serves as a metadata API for client-side components. The response structure should be stable and well-typed for easy consumption. Consider versioning the API if you anticipate breaking changes. The cache headers balance freshness with performance; adjust TTL based on how often model configurations change.