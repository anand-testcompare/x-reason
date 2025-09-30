# TODO (FOR HUMANS ONLY NOT AGENTS)
-- @AGENTS execute on your stories by  

1. Audit AI SDK usage and env variables across the codebase (providers, API routes, UI).
2. Define canonical env names and precedence: AI_GATEWAY_API_KEY only; do not fall back to OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or XAI_API_KEY.
3. Refactor apps/x-reason-web/src/app/api/ai/providers.ts to support Vercel AI Gateway (baseURL + AI_GATEWAY_API_KEY).
4. Enforce Gateway-only auth in providers.ts; throw a clear error if AI_GATEWAY_API_KEY is missing.
5. Fix apps/x-reason-web/src/app/api/credentials/check/route.ts to check GOOGLE_GENERATIVE_AI_API_KEY (replace GEMINI_API_KEY).
6. Update apps/x-reason-web/.env.example with AI_GATEWAY_API_KEY (Gateway-only). 
7. Verify local apps/x-reason-web/.env.local alignment; ensure no secrets are committed to the repo.
8. Expand OpenAI model list in providers.ts types/defaults to latest supported models (keep backwards compatibility where possible).
9. Expand Gemini model list in providers.ts types/defaults to latest supported models (flash/lite/pro as applicable).
10. Add XAI provider in providers.ts via Vercel AI SDK compatibility; wire model creation and credentials.
11. Add only fast Grok variants (e.g., Grok fast, Grok code fast); explicitly exclude the expensive Grok-4 model.
12. Include 'xai' in apps/x-reason-web/src/app/api/ai/chat/route.ts validProviders and ensure model resolution works.
13. Update apps/x-reason-web/src/app/components/ui/ai-provider-selector.tsx to list XAI and its fast models.
14. Create apps/x-reason-web/src/app/api/ai/models/route.ts to return configured providers, available models, defaults, and env-enabled flags.
15. Add unit tests for providers enforcing Gateway-only auth (success with AI_GATEWAY_API_KEY; error when missing).
16. Add unit tests for chat route to accept 'xai' provider and verify streaming with default and explicit models.
17. Enhance apps/x-reason-web/src/app/api/credentials/check/route.ts to include Gateway readiness (Gateway-only) and remediation hints in JSON response.
18. Add mock JSON fixtures under apps/x-reason-web/public/ (e.g., /models/*.json) for offline development and an opt-in dev fallback.
19. Update AI_SDK_VERIFICATION.md and README with Gateway setup steps, env precedence, supported model lists, and caveats.
20. Run pnpm lint and pnpm test; resolve any lint/test regressions introduced by the refactor.