# Story Index - Vercel AI Gateway Migration

This directory contains 20 implementation-ready user stories for migrating to Vercel AI Gateway with AI_GATEWAY_API_KEY.

## Story Organization

Stories are organized into logical phases for sequential implementation:

### Phase 1: Foundation & Planning (Stories 001-002)
- **001** - Audit AI SDK usage and environment variables
- **002** - Define canonical environment variable names and precedence

### Phase 2: Core Provider Refactoring (Stories 003-005)
- **003** - Refactor providers.ts for Vercel AI Gateway support
- **004** - Enforce Gateway-only authentication in providers.ts
- **005** - Fix credentials check route (GEMINI_API_KEY → GOOGLE_GENERATIVE_AI_API_KEY)

### Phase 3: Configuration & Documentation (Stories 006-007)
- **006** - Update .env.example for Gateway-only authentication
- **007** - Verify .env.local alignment and prevent secret commits

### Phase 4: Model Expansion (Stories 008-009)
- **008** - Expand OpenAI model list with latest supported models
- **009** - Expand Google Gemini model list with latest variants

### Phase 5: XAI Provider Integration (Stories 010-013)
- **010** - Add XAI provider to providers.ts via Vercel AI SDK
- **011** - Add fast Grok variants to XAI provider (exclude Grok-4)
- **012** - Update chat route to accept XAI provider
- **013** - Add XAI and fast models to AI provider selector UI

### Phase 6: API Enhancement (Stories 014, 017-018)
- **014** - Create models metadata API route
- **017** - Enhance credentials check route with Gateway readiness and remediation
- **018** - Add mock JSON fixtures for offline development

### Phase 7: Testing (Stories 015-016)
- **015** - Add unit tests for Gateway-only authentication enforcement
- **016** - Add unit tests for chat route XAI provider support

### Phase 8: Documentation & Final Verification (Stories 019-020)
- **019** - Update AI_SDK_VERIFICATION.md and README with Gateway setup
- **020** - Run lint and test, resolve any regressions

## Implementation Guidelines

### Sequential Dependencies
Stories should generally be implemented in order, as later stories depend on earlier ones:
- Stories 003-020 depend on 001 (Audit)
- Stories 003-020 depend on 002 (ENV specification)
- Stories 010-013 form a logical group (XAI integration)
- Stories 015-016 test work from earlier stories
- Story 020 is the final verification

### Parallel Work Opportunities
These story groups can be worked in parallel after Phase 2 is complete:
- **Track A**: Model expansion (008-009)
- **Track B**: XAI integration (010-013)
- **Track C**: API enhancements (014, 017-018)

Then converge for testing and documentation (015-020).

### Story Format
Each story file contains:
- **Status**: Checklist to track progress (update as you work)
- **Intent**: Why this work matters
- **Scope and guardrails**: What's in/out of scope
- **What to do**: Concrete implementation steps
- **Acceptance criteria**: Definition of "done"
- **Lightweight tests**: 1-2 tests minimum (Jest)
- **No-regression verification**: Commands to verify stability
- **Dependencies**: Which stories must be completed first
- **Estimate**: XS / S / M / L

### Working with Stories
1. Read the story file completely before starting
2. Update the Status section as you work
3. Follow the "Steps to implement" section sequentially
4. Add the specified tests (don't skip testing)
5. Run no-regression verification commands
6. When fully complete, DELETE the story file (per instructions)

## Quick Reference

### Environment Variables
- **Required**: `AI_GATEWAY_API_KEY` (Gateway-only)
- **Deprecated**: `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `XAI_API_KEY`
- **Optional**: `AI_GATEWAY_BASE_URL` (custom Gateway URL)
- **Dev-only**: `USE_MOCK_AI=true` (offline development)

### Key Files Modified
- `apps/x-reason-web/src/app/api/ai/providers.ts` - Core provider abstraction
- `apps/x-reason-web/src/app/api/ai/chat/route.ts` - Chat API route
- `apps/x-reason-web/src/app/api/credentials/check/route.ts` - Credentials check
- `apps/x-reason-web/src/app/components/ui/ai-provider-selector.tsx` - Provider UI
- `apps/x-reason-web/.env.example` - Environment template
- `apps/x-reason-web/README.md` - Main documentation
- `apps/x-reason-web/AI_SDK_VERIFICATION.md` - Setup verification

### Verification Commands
```bash
# Run after each story
pnpm lint            # Code style and quality
pnpm test            # Unit tests
pnpm build           # Production build
pnpm dev             # Manual testing
```

## Progress Tracking

Update this section as stories are completed:

- [ ] 001 - Audit AI SDK usage
- [ ] 002 - Define ENV precedence
- [ ] 003 - Refactor providers.ts Gateway support
- [ ] 004 - Enforce Gateway-only auth
- [ ] 005 - Fix credentials check
- [ ] 006 - Update .env.example
- [ ] 007 - Verify .env.local alignment
- [ ] 008 - Expand OpenAI models
- [ ] 009 - Expand Gemini models
- [ ] 010 - Add XAI provider
- [ ] 011 - Add XAI fast models
- [ ] 012 - Update chat route XAI
- [ ] 013 - Update provider selector UI
- [ ] 014 - Create models API route
- [ ] 015 - Test Gateway auth enforcement
- [ ] 016 - Test chat route XAI
- [ ] 017 - Enhance credentials check
- [ ] 018 - Add mock JSON fixtures
- [ ] 019 - Update documentation
- [ ] 020 - Final verification

## Notes

- Each story is self-contained and implementation-ready
- Stories include explicit test requirements (no skipping tests!)
- Delete story files when fully complete (keeps TODO clean)
- If you discover issues, create a new story rather than breaking existing ones
- The story-decomposition-agent can regenerate stories if needed

---

**Generated by**: story-decomposition-agent
**Date**: 2025-09-29
**Source TODO**: /Users/anandpant/Development/x-reason/TODO.md