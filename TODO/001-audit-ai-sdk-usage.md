# Story 001 — Foundation: Audit AI SDK Usage and Environment Variables

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [ ] Done (delete this story file after completion)

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

## Intent

Establish a comprehensive inventory of all AI SDK integrations, environment variable usage, and provider configurations across the codebase. This audit provides the foundation for migrating to Vercel AI Gateway by identifying all touchpoints that need updating.

## Scope and guardrails

- Read-only audit; no code changes in this story
- Document findings in a structured format
- Focus on AI provider usage, API routes, and environment variables
- Keep audit scoped to AI SDK and credentials (exclude unrelated env vars)

## What to do

1. Search for all Vercel AI SDK imports (`ai`, `@ai-sdk/openai`, `@ai-sdk/google`, `@ai-sdk/anthropic`, etc.) across the codebase
2. Identify all files that reference `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `GEMINI_API_KEY`, `XAI_API_KEY`, or `AI_GATEWAY_API_KEY`
3. Document all API routes that interact with AI providers (`apps/x-reason-web/src/app/api/`)
4. List all UI components that reference or select AI providers
5. Note any middleware, server actions, or utilities that handle AI credentials
6. Identify all `.env.example`, `.env.local`, or configuration files with AI-related variables
7. Create a findings document that maps:
   - Files using AI SDK → Provider(s) used → Environment variables referenced
   - API routes → AI operations → Provider dependencies
   - UI components → Provider selection logic → Credential flows

## Acceptance criteria (what success looks like)

- Complete inventory of all AI SDK usage points (files, line numbers, providers)
- Documented list of all environment variables currently in use
- Mapping of API routes to their AI provider dependencies
- Identification of all UI components that interact with provider selection
- Clear understanding of credential flow from environment → providers → API routes → UI
- No files or patterns missed that could break during migration

## Lightweight tests to add (1–2 minimum)

This is an audit story, so no new tests are required. However, verify:
- All existing tests still pass: `pnpm test`
- Linting remains clean: `pnpm lint`

## Steps to implement

1) Use Grep to search for Vercel AI SDK imports:
   - Pattern: `from ['"]ai['"]` and `from ['"]@ai-sdk/`
   - Document all matches with file paths

2) Use Grep to search for environment variable references:
   - Pattern: `OPENAI_API_KEY|GOOGLE_GENERATIVE_AI_API_KEY|GEMINI_API_KEY|XAI_API_KEY|AI_GATEWAY_API_KEY`
   - Document all matches with context

3) Use Glob to find all API route files:
   - Pattern: `apps/x-reason-web/src/app/api/**/route.ts`
   - Review each for AI provider usage

4) Use Grep to find provider-related UI components:
   - Pattern: `provider|Provider|ai-provider`
   - Focus on components directory

5) Document findings in a structured format (JSON or markdown table)

6) Create a summary with:
   - Total files affected by migration
   - Critical paths that need updating
   - Risk areas (shared utilities, multiple provider references)

## No-regression verification

- Run:
  - `pnpm lint` (should pass, no changes made)
  - `pnpm test` (should pass, no changes made)
  - `pnpm build` (should succeed, no changes made)
- Manual:
  - Review findings document for completeness

## Out of scope

- Making any code changes (this is audit-only)
- Updating documentation (happens in later stories)
- Modifying test files (unless documenting test coverage gaps)
- Changes to non-AI-related environment variables

## Estimate

M (requires thorough codebase search and documentation)

## Links

- `apps/x-reason-web/src/app/api/ai/` - AI provider abstraction
- `apps/x-reason-web/src/app/api/credentials/` - Credential validation
- `apps/x-reason-web/src/app/components/ui/ai-provider-selector.tsx` - Provider selection UI
- `.env.example` - Environment variable template

## Dependencies

None (this is the foundation story)

## Notes for implementer

Create a findings document that will guide all subsequent stories. Consider using a table format:

| File Path | AI SDK Import | Provider(s) | Env Variables | Notes |
|-----------|---------------|-------------|---------------|-------|
| ... | ... | ... | ... | ... |

This audit will inform the priority and sequencing of migration work in stories 002-020.