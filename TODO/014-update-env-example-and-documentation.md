# Story 014 — Documentation: Update Environment Variables and Setup Docs

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [x] Done (delete this story file after completion)

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

Intent
Update environment variable documentation and setup instructions to reflect the new Vercel AI SDK configuration and removal of client-side credentials. This ensures developers can set up the project correctly on first clone.

Scope and guardrails
- Update `.env.example` in apps/x-reason-web/
- Update README.md with new setup instructions
- Document Vercel AI SDK configuration requirements
- No code changes; documentation only

What to do
- Add `.env.example` entries for Vercel AI SDK:
  - `OPENAI_API_KEY` (server-side only)
  - `GOOGLE_GENERATIVE_AI_API_KEY` (server-side only)
  - Any Vercel-specific variables (e.g., `AI_GATEWAY_API_KEY`, `VERCEL_OIDC_TOKEN`)
- Update README.md "Setup Requirements" section:
  - Explain server-side-only API key usage
  - Remove any mention of client-side credential entry
  - Document Vercel AI SDK provider configuration
- Add note about free usage limits and Vercel-managed rate limiting

Acceptance criteria (what success looks like)
- `.env.example` contains all required Vercel AI SDK variables
- README.md accurately describes new setup process
- No references to client-side credential entry
- Setup instructions work for new developers

Lightweight tests to add (1–2 minimum)
- Manual verification:
  - Test 1: Follow README setup instructions on fresh clone, verify app starts
  - Test 2: Verify `.env.example` contains all variables referenced in providers.ts

Steps to implement
1) Create or update `apps/x-reason-web/.env.example`
2) Add all required environment variables for Vercel AI SDK
3) Update README.md "Setup Requirements" section
4) Remove client credential references from docs
5) Document Vercel AI SDK configuration
7) Test instructions with fresh local setup
8) Commit

No-regression verification
- Run:
  - `pnpm lint && pnpm test && pnpm build`
- Manual:
  - Follow README setup from scratch

Out of scope
- AGENTS.md updates (Story 015)
- API documentation beyond environment setup
- Deployment documentation

Estimate
S

Links
- `/Users/anandpant/Development/x-reason/apps/x-reason-web/.env.example` (create if missing)
- `/Users/anandpant/Development/x-reason/README.md`