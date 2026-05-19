# Local Development Setup

## Prerequisites

- Node.js 20.9+
- pnpm
- Git
- Vercel access to the linked `x-reason` project

## Setup

```bash
pnpm install
pnpm dlx vercel@latest link
pnpm dlx vercel@latest env pull apps/x-reason-web/.env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

`apps/x-reason-web/.env.local` should contain `VERCEL_OIDC_TOKEN`.

Do not add `AI_GATEWAY_API_KEY` or provider-specific keys. If AI calls fail with auth errors, refresh the OIDC token:

```bash
pnpm dlx vercel@latest env pull apps/x-reason-web/.env.local
```

Preview and Production deployments use Vercel's runtime
`x-vercel-oidc-token` function header instead of a runtime
`VERCEL_OIDC_TOKEN` environment variable.

## Checks

```bash
pnpm --filter x-reason test --runInBand
pnpm lint
pnpm build
```

`pnpm --filter x-reason exec tsc --noEmit` currently exposes older repo-wide type debt that Next build skips.
