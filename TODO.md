# TODO

1) Route all AI usage through the Vercel AI SDK ✅

Goal: Remove direct provider SDK usage (OpenAI, Gemini) and standardize on Vercel AI SDK for all model calls.

- [x] Add dependencies in `apps/x-reason-web/package.json`
  - Add `ai` and provider adapters as needed (e.g., `@ai-sdk/openai`, `@ai-sdk/google`).
  - Remove unused direct provider SDKs if present.
- [x] Centralize model provider configuration
  - Update `apps/x-reason-web/src/app/api/ai/providers.ts` to export models via Vercel AI SDK providers.
  - Ensure server-side env usage only; no client-side exposure of provider keys.
- [x] Update chat API to use the SDK
  - Refactor `apps/x-reason-web/src/app/api/ai/chat/route.ts` to use Vercel AI SDK primitives (e.g., streaming helpers) instead of direct clients.
- [x] Migrate any direct provider routes to the unified SDK path
  - Replace usage under:
    - `apps/x-reason-web/src/app/api/openai/` (all)
    - `apps/x-reason-web/src/app/api/gemini/` (all)
  - Ensure `apps/x-reason-web/src/app/api/reasoning/**` uses the centralized provider layer where applicable (e.g., streaming endpoints under `reasoning/stream/route.ts`).
- [x] Update server-side logic and utilities
  - Confirm any helpers in `apps/x-reason-web/src/app/actions`, `.../lib`, or `.../utils` call into the unified provider module.
- [x] Acceptance
  - `pnpm build` succeeds without references to deprecated provider SDKs. ✅
  - `pnpm dev` supports all existing demos via the Vercel AI SDK. ✅
  - All AI-related unit tests pass (`pnpm test`). ⚠️ Pre-existing test failures in interpreter tests (unrelated to AI SDK migration)


2) Remove credentials popup; provide limited free usage ✅

Goal: Eliminate client prompt for OpenAI/Gemini keys and rely on server-side configuration and Vercel-managed usage.

- [x] Remove/replace credential UI and gating
  - Update or remove:
    - `apps/x-reason-web/src/app/components/CredentialsModal.tsx` - Now never displays (needsCredentials always false)
    - `apps/x-reason-web/src/app/components/CredentialsWrapper.tsx` - Simplified, always assumes server credentials
  - Ensure `apps/x-reason-web/src/app/context/CredentialsContext.tsx` no longer blocks flows. ✅
  - Remove any checks in templates that require client-provided keys. ✅
- [x] Update flows and templates
  - Verify demos under `apps/x-reason-web/src/app/templates/` and `apps/x-reason-web/src/app/pages/**` operate without client keys. ✅
- [x] Configuration
  - Document required server env vars in `.env.example` and `README.md` (keys loaded only on server). ✅
  - Note that rate limits and free usage are managed in Vercel; no client key entry needed. ✅
- [x] Acceptance
  - App loads without credential prompts. ✅
  - All demos function out-of-the-box locally with server env set; no client-side secrets. ✅


3) Dead code and imports cleanup

Goal: Remove unused files and stale imports after the migration.

- [ ] Delete or archive deprecated API directories
  - Remove `apps/x-reason-web/src/app/api/openai/` and `apps/x-reason-web/src/app/api/gemini/` after migration.
- [ ] Remove unused helpers and types
  - Search for unused exports referencing old providers in `actions`, `lib`, `utils`, and `components`.
- [ ] Fix imports
  - Update remaining imports to the unified provider module in `api/ai/providers.ts`.
- [ ] Acceptance
  - `pnpm lint` passes, no unused imports or dead files.


4) Tests, linting, and documentation

Goal: Keep quality gates green and docs accurate.

- [ ] Lint and typecheck
  - Run `pnpm lint` and fix reported issues.
- [ ] Update/expand tests
  - Ensure AI-related tests under `apps/x-reason-web/src/app/test` reflect the new provider layer and mocks.
  - Update or add unit tests for `api/ai/chat/route.ts` and any reasoning stream behavior.
- [ ] Update docs
  - Update `README.md` with local dev steps, env expectations, and Vercel AI SDK notes.
  - Update `AGENTS.md` to reflect agent updates and how they interact with the app.
- [ ] Acceptance
  - `pnpm test` passes locally (consider `CI=true pnpm test` for stricter checks).
  - Docs match the new architecture and do not reference removed code.


5) Developer ergonomics

Goal: Make it easy to work with the new setup.

- [ ] Add `.env.example` entries for all required server-side keys used by the Vercel AI SDK.
- [ ] Ensure `pnpm dev`, `pnpm build`, `pnpm start` work from the monorepo root.
- [ ] Add short migration notes to `README.md` describing the provider consolidation and removal of client credentials.
