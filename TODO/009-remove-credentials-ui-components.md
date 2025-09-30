# Story 009 — Credentials UI: Remove Client-Side Credential Components

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [x] Done (delete this story file after completion)

Completion Notes:
- Simplified CredentialsContext to remove client-side key storage
- Deleted CredentialsModal.tsx entirely
- Updated CredentialsWrapper to only use server credentials
- All AI provider operations now use server-side keys only
- No credential prompts shown to users

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

Intent
Remove or replace all client-side credential UI components and gating logic now that the app relies solely on server-side configuration. This eliminates user confusion and simplifies the onboarding experience.

Scope and guardrails
- Remove or stub credential modal and wrapper components
- Update context to remove credential gating
- No changes to server-side API key handling
- Maintain any UI elements needed for provider selection (without key entry)

What to do
- Update or remove `apps/x-reason-web/src/app/components/CredentialsModal.tsx`
- Update or remove `apps/x-reason-web/src/app/components/CredentialsWrapper.tsx`
- Update `apps/x-reason-web/src/app/context/CredentialsContext.tsx` to remove key storage and validation
- Remove credential checks in templates (AgentDemoTemplate, MultiStepAgentDemoTemplate)
- Update AI provider selector to be informational only (no key input)
- Remove any localStorage logic for storing credentials

Acceptance criteria (what success looks like)
- No credential input UI appears in the application
- CredentialsContext no longer blocks flows or stores keys
- Templates and demos work without client-side credential checks
- AI provider selector (if kept) shows read-only info
- No localStorage reads/writes for API keys
- App loads directly to demos without prompts

Lightweight tests to add (1–2 minimum)
- Unit (Jest):
  - Test 1: Render main app page, verify no credential modal appears
  - Test 2: Test CredentialsContext, verify it doesn't gate content or store keys

Steps to implement
1) Update `CredentialsContext.tsx` to remove key storage and gating
2) Remove or stub `CredentialsModal.tsx`
3) Remove or stub `CredentialsWrapper.tsx`
4) Update templates to remove credential checks
5) Update AI provider selector component (if applicable)
6) Remove credential-related localStorage code
7) Test all demos load without prompts
8) Add unit tests
9) Verify `pnpm test && pnpm build` succeed
10) Commit

No-regression verification
- Run:
  - `pnpm lint && pnpm test && pnpm build`
- Manual:
  - `pnpm dev` then verify no credential prompts appear

Out of scope
- Server-side API key configuration changes
- Environment variable setup (covered in Story 014)
- Changes to actual API routes

Estimate
S

Links
- `/Users/anandpant/Development/x-reason/apps/x-reason-web/src/app/components/CredentialsModal.tsx`
- `/Users/anandpant/Development/x-reason/apps/x-reason-web/src/app/components/CredentialsWrapper.tsx`
- `/Users/anandpant/Development/x-reason/apps/x-reason-web/src/app/context/CredentialsContext.tsx`
- `/Users/anandpant/Development/x-reason/apps/x-reason-web/src/app/templates/`