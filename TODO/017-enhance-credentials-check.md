# Story 017 — Enhancement: Update Credentials Check Route for Gateway-Only and Remediation Hints

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [ ] Done (delete this story file after completion)

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

## Intent

Enhance the credentials check API route to reflect Gateway-only authentication requirements. Return Gateway readiness status, clear remediation hints when credentials are missing, and guide users to correct configuration.

## Scope and guardrails

- Modify only `apps/x-reason-web/src/app/api/credentials/check/route.ts`
- Check for AI_GATEWAY_API_KEY (Gateway-only, no provider-specific keys)
- Return structured JSON with readiness status and remediation guidance
- Maintain backward compatibility with existing clients consuming this endpoint
- Add helpful error messages and setup instructions

## What to do

1. Read `apps/x-reason-web/src/app/api/credentials/check/route.ts` to understand current structure

2. Update credential check logic for Gateway-only:
   ```typescript
   export async function GET() {
     const hasGatewayKey = !!process.env.AI_GATEWAY_API_KEY;

     const response = {
       gatewayConfigured: hasGatewayKey,
       ready: hasGatewayKey,
       providers: {
         openai: { enabled: hasGatewayKey },
         google: { enabled: hasGatewayKey },
         xai: { enabled: hasGatewayKey },
       },
       remediation: hasGatewayKey ? null : {
         issue: 'AI_GATEWAY_API_KEY is not configured',
         steps: [
           'Get your API key from Vercel AI Gateway',
           'Add AI_GATEWAY_API_KEY=your_key to .env.local',
           'Restart the development server',
           'See docs/ENV_CONFIG.md for detailed setup',
         ],
         docsUrl: '/docs/ENV_CONFIG.md',
       },
       deprecatedKeys: {
         OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
         GOOGLE_GENERATIVE_AI_API_KEY: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
         XAI_API_KEY: !!process.env.XAI_API_KEY,
       },
       deprecatedKeysWarning: (
         process.env.OPENAI_API_KEY ||
         process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
         process.env.XAI_API_KEY
       ) ? 'Provider-specific keys found but are no longer used. Use AI_GATEWAY_API_KEY instead.' : null,
     };

     return NextResponse.json(response);
   }
   ```

3. Add TypeScript types for response structure:
   ```typescript
   export interface ProviderStatus {
     enabled: boolean;
   }

   export interface RemediationSteps {
     issue: string;
     steps: string[];
     docsUrl: string;
   }

   export interface CredentialsCheckResponse {
     gatewayConfigured: boolean;
     ready: boolean;
     providers: {
       openai: ProviderStatus;
       google: ProviderStatus;
       xai: ProviderStatus;
     };
     remediation: RemediationSteps | null;
     deprecatedKeys: Record<string, boolean>;
     deprecatedKeysWarning: string | null;
   }
   ```

4. Add helpful HTTP status codes:
   ```typescript
   const status = hasGatewayKey ? 200 : 503; // Service Unavailable if not configured
   return NextResponse.json(response, { status });
   ```

5. Add cache headers (short TTL since configuration can change):
   ```typescript
   return NextResponse.json(response, {
     status,
     headers: {
       'Cache-Control': 'no-store, must-revalidate',
     },
   });
   ```

6. Add JSDoc comments documenting the endpoint

## Acceptance criteria (what success looks like)

- Endpoint checks for AI_GATEWAY_API_KEY (Gateway-only)
- Returns `gatewayConfigured: true` when AI_GATEWAY_API_KEY is set
- Returns `gatewayConfigured: false` when AI_GATEWAY_API_KEY is missing
- Includes remediation steps when credentials missing
- All providers (OpenAI, Gemini, XAI) share same enabled status (based on Gateway key)
- Detects deprecated provider-specific keys and warns users
- Returns 503 status when not configured (service unavailable)
- Returns 200 status when properly configured
- Response includes documentation URL for setup help
- TypeScript types exported for client consumption
- JSDoc comments document endpoint usage

## Lightweight tests to add (1–2 minimum)

- Unit test (Jest): Enhanced credentials check route
  - Test 1: Verify route returns ready=true when AI_GATEWAY_API_KEY set
  - Test 2: Verify route returns remediation steps when AI_GATEWAY_API_KEY missing

Add to: `apps/x-reason-web/src/app/test/credentials-check.test.ts` (extend from Story 005)

```typescript
import { GET } from '@/app/api/credentials/check/route';

describe('credentials check - Gateway-only', () => {
  it('should return ready when Gateway key configured', async () => {
    process.env.AI_GATEWAY_API_KEY = 'gateway-test-key';

    const response = await GET(new Request('http://localhost/api/credentials/check'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.gatewayConfigured).toBe(true);
    expect(data.ready).toBe(true);
    expect(data.providers.openai.enabled).toBe(true);
    expect(data.providers.google.enabled).toBe(true);
    expect(data.providers.xai.enabled).toBe(true);
    expect(data.remediation).toBeNull();
  });

  it('should return not ready with remediation when Gateway key missing', async () => {
    delete process.env.AI_GATEWAY_API_KEY;

    const response = await GET(new Request('http://localhost/api/credentials/check'));
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.gatewayConfigured).toBe(false);
    expect(data.ready).toBe(false);
    expect(data.providers.openai.enabled).toBe(false);
    expect(data.remediation).toBeTruthy();
    expect(data.remediation.steps).toBeInstanceOf(Array);
    expect(data.remediation.docsUrl).toBeTruthy();
  });

  it('should warn about deprecated keys', async () => {
    delete process.env.AI_GATEWAY_API_KEY;
    process.env.OPENAI_API_KEY = 'old-openai-key';

    const response = await GET(new Request('http://localhost/api/credentials/check'));
    const data = await response.json();

    expect(data.deprecatedKeys.OPENAI_API_KEY).toBe(true);
    expect(data.deprecatedKeysWarning).toContain('Provider-specific keys');
    expect(data.deprecatedKeysWarning).toContain('AI_GATEWAY_API_KEY');
  });
});
```

## Steps to implement

1) Read `apps/x-reason-web/src/app/api/credentials/check/route.ts`

2) Update credential check logic to check AI_GATEWAY_API_KEY only

3) Define TypeScript interfaces for response structure

4) Implement remediation steps generation

5) Add deprecated key detection and warnings

6) Update HTTP status codes (200 when configured, 503 when not)

7) Add cache headers (no-store for dynamic checks)

8) Add JSDoc comments

9) Export TypeScript types

10) Extend test file: `apps/x-reason-web/src/app/test/credentials-check.test.ts`

11) Add unit tests as specified

12) Run tests: `pnpm test`

13) Manual test:
    - `pnpm dev`
    - Test with Gateway key: `curl http://localhost:3000/api/credentials/check`
    - Test without Gateway key: verify remediation steps
    - Test with deprecated keys: verify warnings

## No-regression verification

- Run:
  - `pnpm lint` (should pass)
  - `pnpm test` (all tests including new ones should pass)
  - `pnpm build` (should succeed)
- Manual:
  - Test endpoint with AI_GATEWAY_API_KEY set (should return 200)
  - Test endpoint without AI_GATEWAY_API_KEY (should return 503 with remediation)
  - Test endpoint with deprecated keys (should warn)
  - Verify any UI consuming this endpoint still works

## Out of scope

- Implementing UI to display remediation steps (separate story)
- Testing actual AI provider connectivity (health checks)
- Validating API key format or authenticity
- Rate limiting or authentication for endpoint
- Migrating existing UI components to use new response structure

## Estimate

M (significant enhancement with structured responses and testing)

## Links

- `apps/x-reason-web/src/app/api/credentials/check/route.ts` - File to modify
- `apps/x-reason-web/src/app/test/credentials-check.test.ts` - Test file
- `apps/x-reason-web/docs/ENV_CONFIG.md` - Referenced in remediation

## Dependencies

- Story 002 (ENV specification) - completed (for remediation guidance)
- Story 004 (Gateway-only enforcement) - completed (for consistency)

## Notes for implementer

This endpoint becomes a health-check and configuration-guidance tool. The remediation steps should be actionable and link to documentation. The 503 status code signals to clients that the service is unavailable due to configuration, not a server error. Use clear, beginner-friendly language in remediation messages.