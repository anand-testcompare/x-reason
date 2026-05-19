# Environment Configuration

This project uses Vercel AI Gateway through OIDC only. Do not add provider keys or an `AI_GATEWAY_API_KEY`.

## Local Development

```bash
VERCEL_OIDC_TOKEN
```

For local development, refresh it from the linked Vercel project:

```bash
pnpm dlx vercel@latest env pull apps/x-reason-web/.env.local
```

Vercel OIDC tokens are short lived. Refresh the env file when AI calls begin failing with auth errors.

In Vercel Preview and Production, `VERCEL_OIDC_TOKEN` is not expected to exist at
runtime. Vercel exposes the OIDC token to functions on the
`x-vercel-oidc-token` request header, and the Vercel AI SDK reads that header
when routing plain Gateway model IDs.

## Unsupported

These variables are ignored and should not be used:

```bash
AI_GATEWAY_API_KEY
OPENAI_API_KEY
GOOGLE_GENERATIVE_AI_API_KEY
GEMINI_API_KEY
XAI_API_KEY
```

## Expected Local File

`apps/x-reason-web/.env.local` should contain:

```bash
VERCEL_OIDC_TOKEN=...
```

The file is gitignored and must not be committed.
