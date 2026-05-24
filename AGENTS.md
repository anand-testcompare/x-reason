# Agent Guidelines

## Vercel OIDC

- x-reason uses Vercel AI Gateway through OIDC. Do not add `AI_GATEWAY_API_KEY` or provider-specific API keys as a workaround.
- Local OIDC tokens are short-lived. If AI Gateway calls fail with missing, expired, unauthenticated, or invalid OIDC errors, refresh the linked Vercel development environment before debugging app code:

```bash
pnpm dlx vercel@latest env pull apps/x-reason-web/.env.local
```

- Run the refresh from the repository root. If the repo is not linked, run `pnpm dlx vercel@latest link` from the repository root first, then pull the env file.
- After refreshing `.env.local`, restart the local Next.js dev server so it picks up the new `VERCEL_OIDC_TOKEN`.
