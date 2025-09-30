# Story 002 — Configuration: Define Canonical Environment Variable Names and Precedence

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [ ] Done (delete this story file after completion)

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

## Intent

Establish a single source of truth for environment variable naming and precedence rules. The migration to Vercel AI Gateway requires `AI_GATEWAY_API_KEY` as the only credential, eliminating fallback chains to provider-specific keys (OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, XAI_API_KEY).

## Scope and guardrails

- Document-only change; create a configuration specification
- No code changes in this story (enforcement happens in later stories)
- Define clear, non-ambiguous rules for environment variable precedence
- Prepare for Gateway-only authentication model

## What to do

1. Create a configuration document: `apps/x-reason-web/docs/ENV_CONFIG.md`
2. Define the canonical environment variable: `AI_GATEWAY_API_KEY`
3. Document that provider-specific keys (OPENAI_API_KEY, etc.) are DEPRECATED and will NOT be used as fallbacks
4. Specify error behavior: if `AI_GATEWAY_API_KEY` is missing, the application should fail fast with a clear error message
5. Document the environment variable precedence order (Gateway-only, no fallbacks)
6. Include examples of correct `.env.local` configuration
7. Add migration guidance for developers who have provider-specific keys in their local environments

## Acceptance criteria (what success looks like)

- `apps/x-reason-web/docs/ENV_CONFIG.md` exists with complete specification
- Clear statement: "AI_GATEWAY_API_KEY is the ONLY credential required"
- Explicit documentation: "Do NOT fall back to OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or XAI_API_KEY"
- Error handling policy defined: "Throw clear error if AI_GATEWAY_API_KEY is missing"
- Migration path documented for developers with existing configurations
- Examples provided for correct `.env.local` setup

## Lightweight tests to add (1–2 minimum)

This is a documentation story, so no new tests are required. However:
- Verify existing tests pass: `pnpm test`
- Ensure linting passes: `pnpm lint`

## Steps to implement

1) Create `apps/x-reason-web/docs/` directory if it doesn't exist

2) Write `apps/x-reason-web/docs/ENV_CONFIG.md` with sections:
   - Overview: Why Gateway-only authentication
   - Canonical variable: `AI_GATEWAY_API_KEY`
   - Deprecated variables: List of provider-specific keys
   - Precedence rules: Gateway-only, no fallbacks
   - Error handling: Fail-fast policy
   - Examples: Correct `.env.local` configuration
   - Migration guide: Steps for developers to update their local environments

3) Include code examples showing the intended error message:
   ```typescript
   if (!process.env.AI_GATEWAY_API_KEY) {
     throw new Error(
       'AI_GATEWAY_API_KEY is required. Please set it in your .env.local file. ' +
       'Provider-specific keys (OPENAI_API_KEY, etc.) are no longer supported.'
     );
   }
   ```

4) Document the benefits of Gateway-only authentication:
   - Simplified credential management
   - Unified billing and monitoring
   - Consistent rate limiting
   - Single point of configuration

## No-regression verification

- Run:
  - `pnpm lint` (should pass)
  - `pnpm test` (should pass)
  - `pnpm build` (should succeed)
- Manual:
  - Review ENV_CONFIG.md for clarity and completeness

## Out of scope

- Implementing the precedence rules in code (Story 003-004)
- Updating .env.example (Story 006)
- Modifying provider.ts or other code files
- Updating README or other documentation (Story 019)

## Estimate

XS (documentation only)

## Links

- `apps/x-reason-web/docs/` - Documentation directory
- Future reference: `apps/x-reason-web/src/app/api/ai/providers.ts`

## Dependencies

- Story 001 (Audit) should be completed to inform this specification

## Notes for implementer

This document will be the canonical reference for Stories 003-020. Keep it concise but comprehensive. Use clear examples and error messages that will be copy-pasted into code in subsequent stories.