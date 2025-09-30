# Story 019 — Documentation: Update AI_SDK_VERIFICATION.md and README with Gateway Setup

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [ ] Done (delete this story file after completion)

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

## Intent

Update project documentation to reflect the Vercel AI Gateway migration, Gateway-only authentication, environment variable precedence, supported model lists, and important caveats. Provide clear setup instructions for new developers and deployment guidance.

## Scope and guardrails

- Update `apps/x-reason-web/AI_SDK_VERIFICATION.md` with Gateway information
- Update `apps/x-reason-web/README.md` with Gateway setup steps
- Document environment variable precedence and Gateway-only policy
- List all supported models for OpenAI, Gemini, and XAI
- Include caveats and migration notes for existing users
- Keep documentation beginner-friendly and actionable
- Add links to relevant configuration files and API documentation

## What to do

1. Update `apps/x-reason-web/AI_SDK_VERIFICATION.md`:
   - Add section: "Vercel AI Gateway Setup"
   - Document AI_GATEWAY_API_KEY requirement
   - Explain Gateway benefits (unified billing, monitoring, rate limiting)
   - Add setup instructions with examples
   - Include verification steps
   - Document supported providers and models
   - Add troubleshooting section

2. Update `apps/x-reason-web/README.md`:
   - Update "Setup Requirements" section:
     ```markdown
     ### Setup Requirements
     - Requires Vercel AI Gateway API key in `.env.local`
       - AI_GATEWAY_API_KEY (REQUIRED)
     - Uses Gateway for unified access to OpenAI, Google Gemini, and XAI models
     - Development server runs on `http://localhost:3000`
     - All AI credentials are server-side only (no client-side keys required)

     ### Getting Started
     1. Copy environment template: `cp .env.example .env.local`
     2. Get your AI Gateway API key from [Vercel AI Gateway](https://vercel.com/docs/ai-gateway)
     3. Add to `.env.local`: `AI_GATEWAY_API_KEY=your_gateway_key_here`
     4. Install dependencies: `pnpm install`
     5. Run development server: `pnpm dev`
     6. Open [http://localhost:3000](http://localhost:3000)
     ```

3. Add "Supported Models" section to README:
   ```markdown
   ## Supported AI Providers and Models

   ### OpenAI
   - GPT-4o (latest flagship)
   - GPT-4o Mini (cost-effective, default)
   - GPT-4 Turbo
   - GPT-3.5 Turbo
   - o1-preview (advanced reasoning)
   - o1-mini (efficient reasoning)

   ### Google Gemini
   - Gemini 1.5 Pro (flagship)
   - Gemini 1.5 Flash (fast, default)
   - Gemini 1.5 Flash 8B (ultra-fast)
   - Gemini 2.0 Flash Experimental

   ### X.AI (Grok)
   - Grok Beta (fast, default)
   - Grok 2 Turbo (optimized speed)
   - Grok Vision Beta (vision capabilities)
   - Note: Expensive models (Grok-4) are explicitly excluded

   All models accessed via single AI_GATEWAY_API_KEY.
   ```

4. Add "Migration Notes" section for existing users:
   ```markdown
   ## Migration from Provider-Specific Keys

   **IMPORTANT**: If you previously used provider-specific API keys:

   - `OPENAI_API_KEY` → No longer supported
   - `GOOGLE_GENERATIVE_AI_API_KEY` → No longer supported
   - `XAI_API_KEY` → No longer supported

   **Action Required**:
   1. Remove provider-specific keys from `.env.local`
   2. Add `AI_GATEWAY_API_KEY` instead
   3. Update any deployment environment variables
   4. See [docs/ENV_CONFIG.md](docs/ENV_CONFIG.md) for details
   ```

5. Update `apps/x-reason-web/AI_SDK_VERIFICATION.md`:
   ```markdown
   # Vercel AI SDK Verification

   ## Gateway Setup

   This project uses Vercel AI Gateway for unified AI provider access.

   ### Configuration

   Set in `.env.local`:
   ```bash
   AI_GATEWAY_API_KEY=your_gateway_api_key_here
   ```

   ### Verification Steps

   1. Check credentials endpoint:
      ```bash
      curl http://localhost:3000/api/credentials/check
      ```
      Should return: `"gatewayConfigured": true`

   2. Check available models:
      ```bash
      curl http://localhost:3000/api/ai/models
      ```
      Should list all providers and models

   3. Test chat endpoint:
      ```bash
      curl -X POST http://localhost:3000/api/ai/chat \
        -H "Content-Type: application/json" \
        -d '{
          "provider": "openai",
          "messages": [{"role": "user", "content": "Hello"}]
        }'
      ```

   ### Troubleshooting

   **Issue**: `AI_GATEWAY_API_KEY is required` error
   - **Solution**: Add AI_GATEWAY_API_KEY to `.env.local` and restart dev server

   **Issue**: Provider-specific keys found warning
   - **Solution**: Remove OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, XAI_API_KEY from `.env.local`

   **Issue**: Models not appearing in UI
   - **Solution**: Verify `/api/ai/models` endpoint returns providers with `enabled: true`

   ### Supported Providers

   - **OpenAI**: GPT-4o, GPT-4o Mini (default), GPT-4 Turbo, GPT-3.5 Turbo, o1-preview, o1-mini
   - **Google Gemini**: Gemini 1.5 Pro, Gemini 1.5 Flash (default), Gemini 1.5 Flash 8B, Gemini 2.0 Flash Exp
   - **X.AI (Grok)**: Grok Beta (default), Grok 2 Turbo, Grok Vision Beta (fast models only)

   ### Caveats

   - Gateway-only authentication: Provider-specific keys are NOT supported
   - XAI expensive models (Grok-4) are explicitly excluded to prevent cost overruns
   - All providers require single AI_GATEWAY_API_KEY
   - See [docs/ENV_CONFIG.md](../docs/ENV_CONFIG.md) for detailed configuration
   ```

6. Add links to relevant documentation:
   - `docs/ENV_CONFIG.md` (from Story 002)
   - `docs/LOCAL_SETUP.md` (from Story 007)
   - Vercel AI Gateway official docs
   - Provider-specific documentation

## Acceptance criteria (what success looks like)

- `AI_SDK_VERIFICATION.md` updated with Gateway setup, verification, and troubleshooting
- `README.md` updated with Gateway requirements and setup steps
- "Supported Models" section lists all current models for OpenAI, Gemini, XAI
- "Migration Notes" section guides existing users to Gateway
- Documentation is beginner-friendly and includes code examples
- Links to relevant configuration files and official docs
- Troubleshooting section covers common issues
- Caveats section documents excluded models and limitations
- All code examples are tested and accurate

## Lightweight tests to add (1–2 minimum)

This is a documentation story, so no runtime tests are required. However:
- Manual verification: Follow README setup steps on a fresh clone
- Manual verification: Test all curl examples in AI_SDK_VERIFICATION.md
- Manual verification: Verify all links in documentation work

## Steps to implement

1) Read current `apps/x-reason-web/README.md` and `apps/x-reason-web/AI_SDK_VERIFICATION.md`

2) Update README.md:
   - Modify "Setup Requirements" section
   - Add "Supported Models" section
   - Add "Migration Notes" section
   - Update "Getting Started" steps

3) Update AI_SDK_VERIFICATION.md:
   - Add "Gateway Setup" section
   - Add "Verification Steps" with curl examples
   - Add "Troubleshooting" section
   - Add "Supported Providers" section
   - Add "Caveats" section

4) Add links to documentation files:
   - Link to `docs/ENV_CONFIG.md`
   - Link to `docs/LOCAL_SETUP.md`
   - Link to Vercel AI Gateway docs
   - Link to provider docs

5) Test all curl examples manually

6) Verify all links work

7) Run spell check and grammar check

8) Test setup instructions on a fresh clone (if possible)

## No-regression verification

- Run:
  - `pnpm lint` (should pass)
  - `pnpm test` (should pass)
  - `pnpm build` (should succeed)
- Manual:
  - Follow README setup steps from scratch
  - Test all curl examples in AI_SDK_VERIFICATION.md
  - Verify all documentation links work
  - Check for typos and formatting issues

## Out of scope

- Creating new documentation files (except those from previous stories)
- Adding deployment-specific guides (Vercel, Docker, etc.)
- Creating video tutorials or screenshots
- Translating documentation to other languages
- Adding API reference documentation

## Estimate

M (comprehensive documentation update with examples and verification)

## Links

- `apps/x-reason-web/README.md` - File to update
- `apps/x-reason-web/AI_SDK_VERIFICATION.md` - File to update
- `apps/x-reason-web/docs/ENV_CONFIG.md` - Referenced (from Story 002)
- `apps/x-reason-web/docs/LOCAL_SETUP.md` - Referenced (from Story 007)

## Dependencies

- Story 002 (ENV_CONFIG.md) - completed
- Story 007 (LOCAL_SETUP.md) - completed
- Story 008-009 (Model lists) - completed
- Story 010-011 (XAI provider) - completed

## Notes for implementer

Keep documentation clear, concise, and beginner-friendly. Use code examples liberally. Test all curl commands to ensure they work. The migration notes are important for existing users - make them prominent and actionable. Link to relevant configuration files so users can deep-dive if needed.