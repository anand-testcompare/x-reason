# Story 002 — AI Providers: Centralize Model Configuration via Vercel AI SDK

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [x] Done (delete this story file after completion)

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

Intent
Refactor the provider configuration module to export AI models via the Vercel AI SDK instead of direct provider clients. This creates a single source of truth for model instantiation and ensures server-side-only usage of API keys.

Scope and guardrails
- Modify only `apps/x-reason-web/src/app/api/ai/providers.ts`
- Use Vercel AI SDK's provider factories (e.g., `createOpenAI`, `createGoogleGenerativeAI`)
- Keep server-side environment variable usage only
- Maintain existing provider selection logic
- No changes to API route consumers yet (subsequent stories)

What to do
- Import provider factories from `@ai-sdk/openai` and `@ai-sdk/google`
- Replace direct SDK client instantiation with Vercel AI SDK providers
- Export model instances (e.g., `openai('gpt-4-turbo')`, `google('gemini-pro')`)
- Ensure all API keys are read from server environment variables only
- Add type definitions for exported models
- Preserve any existing provider selection or configuration logic

Acceptance criteria (what success looks like)
- `providers.ts` exports models via Vercel AI SDK provider factories
- No direct OpenAI or Gemini SDK client code remains in this file
- Server environment variables are used for authentication
- Exported models follow Vercel AI SDK patterns (LanguageModel type)
- File compiles without TypeScript errors

Lightweight tests to add (1–2 minimum)
- Unit (Jest):
  - Test 1: Import providers.ts and verify exported models have expected structure (model id, provider name)
  - Test 2: Mock environment variables and verify provider initialization doesn't throw

Steps to implement
1) Open `apps/x-reason-web/src/app/api/ai/providers.ts`
2) Replace direct SDK imports with Vercel AI SDK provider imports
3) Update provider instantiation to use `createOpenAI()` and `createGoogleGenerativeAI()`
4) Export specific model instances (e.g., `gpt4`, `gemini`)
5) Add TypeScript types from `ai` package
6) Write unit tests for provider exports
7) Verify `pnpm build` succeeds
8) Commit

No-regression verification
- Run:
  - `pnpm lint && pnpm test && pnpm build`
- Manual:
  - `pnpm dev` then check `http://localhost:3000`

Out of scope
- Migration of API route consumers (chat, reasoning, etc.)
- Changes to component-level code
- Client-side provider logic

Estimate
S

Links
- `/Users/anandpant/Development/x-reason/apps/x-reason-web/src/app/api/ai/providers.ts`
- Vercel AI SDK docs: https://sdk.vercel.ai/docs/foundations/providers-and-models