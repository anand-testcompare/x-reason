# Story 018 — Development: Add Mock JSON Fixtures for Offline Development

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [ ] Done (delete this story file after completion)

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

## Intent

Create mock JSON fixtures for AI model metadata and responses to support offline development and testing. Provide an opt-in development fallback when AI_GATEWAY_API_KEY is not configured, enabling developers to work on UI and non-AI features without live credentials.

## Scope and guardrails

- Create mock JSON files under `apps/x-reason-web/public/`
- Provide realistic mock data for models, providers, and sample responses
- Add opt-in development mode flag (environment variable or config)
- Do NOT use mocks in production or when AI_GATEWAY_API_KEY is set
- Keep mocks realistic and representative of actual API responses
- Document how to enable/disable mock mode

## What to do

1. Create mock directory structure:
   ```
   apps/x-reason-web/public/mocks/
   ├── models.json          # Provider and model metadata
   ├── chat-response.json   # Sample chat completion
   └── README.md            # Mock usage documentation
   ```

2. Create `apps/x-reason-web/public/mocks/models.json`:
   ```json
   {
     "providers": [
       {
         "id": "openai",
         "name": "OpenAI",
         "enabled": true,
         "models": {
           "gpt-4o": {
             "name": "GPT-4o",
             "description": "Latest flagship model",
             "speed": "fast",
             "costTier": "medium"
           },
           "gpt-4o-mini": {
             "name": "GPT-4o Mini",
             "description": "Cost-effective GPT-4o",
             "speed": "very-fast",
             "costTier": "low"
           }
         },
         "defaultModel": "gpt-4o-mini"
       },
       {
         "id": "google",
         "name": "Google Gemini",
         "enabled": true,
         "models": {
           "gemini-1.5-pro": {
             "name": "Gemini 1.5 Pro",
             "description": "Flagship model, best quality",
             "speed": "medium",
             "costTier": "medium"
           },
           "gemini-1.5-flash": {
             "name": "Gemini 1.5 Flash",
             "description": "Fast and cost-effective",
             "speed": "fast",
             "costTier": "low"
           }
         },
         "defaultModel": "gemini-1.5-flash"
       },
       {
         "id": "xai",
         "name": "X.AI (Grok)",
         "enabled": true,
         "models": {
           "grok-beta": {
             "name": "Grok Beta",
             "description": "Fast general-purpose model",
             "speed": "fast",
             "costTier": "low"
           },
           "grok-2-turbo": {
             "name": "Grok 2 Turbo",
             "description": "Optimized for speed",
             "speed": "very-fast",
             "costTier": "low"
           }
         },
         "defaultModel": "grok-beta"
       }
     ],
     "gatewayRequired": true,
     "gatewayConfigured": false,
     "mockMode": true
   }
   ```

3. Create `apps/x-reason-web/public/mocks/chat-response.json`:
   ```json
   {
     "id": "mock-response-1",
     "model": "gpt-4o-mini",
     "choices": [
       {
         "message": {
           "role": "assistant",
           "content": "This is a mock response for offline development. Enable AI_GATEWAY_API_KEY for real AI responses."
         }
       }
     ]
   }
   ```

4. Create `apps/x-reason-web/public/mocks/README.md` documenting mock usage:
   ```markdown
   # Mock Fixtures for Offline Development

   ## Purpose
   These mock JSON files enable offline development when AI_GATEWAY_API_KEY is not configured.

   ## Usage
   Set environment variable in .env.local:
   ```
   USE_MOCK_AI=true
   ```

   ## Files
   - `models.json`: Provider and model metadata
   - `chat-response.json`: Sample chat completion response

   ## Notes
   - Mocks are ONLY used when AI_GATEWAY_API_KEY is missing AND USE_MOCK_AI=true
   - Production builds should NEVER use mocks
   - Mocks are realistic but not actual AI responses
   ```

5. Update models API route to support mock fallback:
   ```typescript
   // In apps/x-reason-web/src/app/api/ai/models/route.ts
   export async function GET() {
     const hasGatewayKey = !!process.env.AI_GATEWAY_API_KEY;
     const useMocks = process.env.USE_MOCK_AI === 'true' && !hasGatewayKey;

     if (useMocks) {
       // Return mock data from public/mocks/models.json
       const mockData = await fetch('/mocks/models.json').then(r => r.json());
       return NextResponse.json(mockData);
     }

     // ... existing Gateway-based implementation
   }
   ```

6. Add mock mode indicator to responses when using mocks:
   ```typescript
   if (useMocks) {
     return NextResponse.json({
       ...mockData,
       mockMode: true,
       warning: 'Using mock data. Set AI_GATEWAY_API_KEY for real AI responses.',
     });
   }
   ```

## Acceptance criteria (what success looks like)

- Mock JSON files exist under `apps/x-reason-web/public/mocks/`
- `models.json` contains realistic provider and model metadata
- `chat-response.json` contains sample chat completion
- `README.md` documents mock usage and setup
- Mocks are opt-in via `USE_MOCK_AI=true` environment variable
- Mocks are ONLY used when AI_GATEWAY_API_KEY is missing
- API routes fall back to mocks in dev mode when configured
- Mock responses include `mockMode: true` flag
- Mock responses include warning message about using mocks
- Production builds do NOT use mocks (verified)

## Lightweight tests to add (1–2 minimum)

- Unit test (Jest): Mock mode behavior
  - Test 1: Verify API route returns real data when AI_GATEWAY_API_KEY is set
  - Test 2: Verify API route returns mock data when USE_MOCK_AI=true and no Gateway key

Add to: `apps/x-reason-web/src/app/test/mock-mode.test.ts` (new file)

```typescript
import { GET } from '@/app/api/ai/models/route';

describe('mock mode', () => {
  it('should use real data when Gateway key configured', async () => {
    process.env.AI_GATEWAY_API_KEY = 'gateway-key';
    process.env.USE_MOCK_AI = 'true';

    const response = await GET();
    const data = await response.json();

    expect(data.mockMode).not.toBe(true);
    expect(data.gatewayConfigured).toBe(true);
  });

  it('should use mock data when USE_MOCK_AI=true and no Gateway key', async () => {
    delete process.env.AI_GATEWAY_API_KEY;
    process.env.USE_MOCK_AI = 'true';

    const response = await GET();
    const data = await response.json();

    expect(data.mockMode).toBe(true);
    expect(data.warning).toContain('mock data');
  });

  it('should NOT use mocks when USE_MOCK_AI not set', async () => {
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.USE_MOCK_AI;

    const response = await GET();
    const data = await response.json();

    // Should return not-configured response, not mocks
    expect(data.mockMode).not.toBe(true);
    expect(data.gatewayConfigured).toBe(false);
  });
});
```

## Steps to implement

1) Create directory: `apps/x-reason-web/public/mocks/`

2) Create `models.json` with realistic provider/model data

3) Create `chat-response.json` with sample response

4) Create `README.md` documenting mock usage

5) Update `.env.example` to include `USE_MOCK_AI` (commented out):
   ```bash
   # USE_MOCK_AI=true  # Enable for offline development without AI_GATEWAY_API_KEY
   ```

6) Update models API route (`apps/x-reason-web/src/app/api/ai/models/route.ts`) to support mock fallback

7) Add mock mode indicator to responses

8) Create test file: `apps/x-reason-web/src/app/test/mock-mode.test.ts`

9) Add unit tests as specified

10) Run tests: `pnpm test`

11) Manual test:
    - Remove AI_GATEWAY_API_KEY from `.env.local`
    - Set `USE_MOCK_AI=true`
    - Run `pnpm dev`
    - Verify mock data is returned
    - Verify mock mode warning appears

## No-regression verification

- Run:
  - `pnpm lint` (should pass)
  - `pnpm test` (all tests including new ones should pass)
  - `pnpm build` (should succeed)
- Manual:
  - Test with AI_GATEWAY_API_KEY set: should NOT use mocks
  - Test with USE_MOCK_AI=true and no key: should use mocks
  - Test production build: verify mocks are not used
  - Verify mock JSON files are accessible at `/mocks/models.json`

## Out of scope

- Implementing comprehensive mock data for all API routes
- Creating mock streaming responses
- Building a mock server or interceptor
- Adding UI indicators for mock mode (separate story)
- Creating developer tools for editing mocks

## Estimate

M (creating fixtures, updating routes, testing)

## Links

- `apps/x-reason-web/public/mocks/` - Directory to create
- `apps/x-reason-web/src/app/api/ai/models/route.ts` - Route to update
- `apps/x-reason-web/.env.example` - Add USE_MOCK_AI documentation

## Dependencies

- Story 014 (Models API route) - completed (route to enhance with mocks)

## Notes for implementer

Mocks should be realistic and representative of actual API responses. This enables developers to work on UI and features without requiring live API credentials. Keep mock data minimal but complete enough for development. Ensure production builds never use mocks by checking NODE_ENV and presence of Gateway key.