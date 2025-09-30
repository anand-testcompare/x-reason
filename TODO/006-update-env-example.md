# Story 006 — Configuration: Update .env.example for Gateway-Only Authentication

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [ ] Done (delete this story file after completion)

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

## Intent

Update the environment variable template to reflect Gateway-only authentication. This ensures new developers and deployments start with the correct configuration from day one.

## Scope and guardrails

- Modify only `apps/x-reason-web/.env.example`
- Replace provider-specific keys with AI_GATEWAY_API_KEY
- Add clear comments explaining Gateway setup
- Include optional AI_GATEWAY_BASE_URL for custom Gateway configurations
- Keep .env.example safe to commit (no actual secrets)

## What to do

1. Read current `apps/x-reason-web/.env.example` to understand existing structure

2. Remove deprecated environment variables:
   - OPENAI_API_KEY
   - GOOGLE_GENERATIVE_AI_API_KEY
   - GEMINI_API_KEY
   - XAI_API_KEY

3. Add Gateway-required variables:
   ```bash
   # Vercel AI Gateway (REQUIRED)
   # Get your API key from: https://vercel.com/docs/ai-gateway
   # This single key provides access to OpenAI, Google Gemini, and XAI models
   AI_GATEWAY_API_KEY=your_gateway_api_key_here

   # Vercel AI Gateway Base URL (OPTIONAL)
   # Only needed for custom gateway configurations
   # Default: https://gateway.ai.cloudflare.com/v1/{account}/{gateway}
   # AI_GATEWAY_BASE_URL=
   ```

4. Add a section with setup instructions:
   ```bash
   # Setup Instructions:
   # 1. Copy this file to .env.local: cp .env.example .env.local
   # 2. Get your AI_GATEWAY_API_KEY from Vercel AI Gateway
   # 3. Update .env.local with your actual key (DO NOT commit .env.local)
   # 4. See docs/ENV_CONFIG.md for detailed configuration options
   ```

5. Ensure .env.example has clear, actionable comments

6. Keep any non-AI-related environment variables that exist

## Acceptance criteria (what success looks like)

- `.env.example` contains only `AI_GATEWAY_API_KEY` for AI authentication
- No references to OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or XAI_API_KEY
- Clear comments explain Gateway setup and where to get credentials
- Optional `AI_GATEWAY_BASE_URL` included with explanation
- Setup instructions guide developers through initial configuration
- Reference to `docs/ENV_CONFIG.md` for detailed documentation
- File remains safe to commit (no actual secrets)

## Lightweight tests to add (1–2 minimum)

This is a configuration file, so no runtime tests are needed. However:
- Verify `.env.example` is tracked by git and committable
- Ensure `.env.local` is in `.gitignore` (should already be there)
- Manual test: Copy `.env.example` to `.env.local`, add real key, verify app works

## Steps to implement

1) Read current `apps/x-reason-web/.env.example`

2) Remove all provider-specific API key lines

3) Add `AI_GATEWAY_API_KEY` with descriptive comment

4) Add optional `AI_GATEWAY_BASE_URL` with comment

5) Add setup instructions section

6) Add reference to `docs/ENV_CONFIG.md`

7) Verify file is safe to commit (no secrets, no placeholder keys that could be mistaken for real keys)

8) Test by copying to `.env.local` and running app

## No-regression verification

- Run:
  - `pnpm lint` (should pass)
  - `pnpm test` (should pass)
  - `pnpm build` (should succeed)
- Manual:
  - Verify `.env.example` is tracked in git: `git status apps/x-reason-web/.env.example`
  - Copy to `.env.local`: `cp apps/x-reason-web/.env.example apps/x-reason-web/.env.local`
  - Add real AI_GATEWAY_API_KEY to `.env.local`
  - Run `pnpm dev` and verify app works

## Out of scope

- Modifying `.env.local` (user-specific, not tracked in git)
- Changing other configuration files (next.config.js, etc.)
- Updating documentation (Story 019)
- Adding deployment-specific environment variables

## Estimate

XS (straightforward configuration update)

## Links

- `apps/x-reason-web/.env.example` - File to modify
- `.gitignore` - Verify .env.local is excluded
- `apps/x-reason-web/docs/ENV_CONFIG.md` - Referenced in comments

## Dependencies

- Story 002 (ENV specification) - completed (provides guidance for structure)

## Notes for implementer

This file is the first thing new developers see when setting up the project. Make comments clear, helpful, and actionable. Include links to documentation and credential sources.