# Environment Configuration - AI Gateway

## Overview

This project uses **Gateway-only authentication** for all AI provider access. This means you need only one API key (`AI_GATEWAY_API_KEY`) instead of managing separate keys for OpenAI, Google Gemini, and other providers.

### Why Gateway-Only?

- **Simplified credential management**: One key to rule them all
- **Unified billing and monitoring**: See all API usage in one place
- **Consistent rate limiting**: Better control across providers
- **Single point of configuration**: Easier setup and deployment

## Canonical Environment Variable

### Required

```bash
AI_GATEWAY_API_KEY
```

This is the **ONLY** credential required for AI functionality. Get your key from:
- [Vercel AI Gateway](https://vercel.com/docs/ai-gateway)

### Optional

```bash
AI_GATEWAY_BASE_URL
```

Only needed for custom gateway configurations. Defaults to the Vercel AI Gateway URL.

## Deprecated Variables

The following environment variables are **NO LONGER SUPPORTED** and will **NOT** be used as fallbacks:

- ❌ `OPENAI_API_KEY`
- ❌ `GOOGLE_GENERATIVE_AI_API_KEY`
- ❌ `GEMINI_API_KEY`
- ❌ `XAI_API_KEY`

## Precedence Rules

**Gateway-only, no fallbacks:**

1. Check `AI_GATEWAY_API_KEY`
2. If missing → throw error (fail fast)
3. No fallback to provider-specific keys

## Error Handling

If `AI_GATEWAY_API_KEY` is not set, the application will fail fast with a clear error:

```typescript
if (!process.env.AI_GATEWAY_API_KEY) {
  throw new Error(
    'AI_GATEWAY_API_KEY is required. Please set it in your .env.local file. ' +
    'Provider-specific keys (OPENAI_API_KEY, etc.) are no longer supported.'
  );
}
```

## Configuration Examples

### Correct .env.local Configuration

```bash
# Required: Vercel AI Gateway API Key
AI_GATEWAY_API_KEY=your_actual_gateway_key_here

# Optional: Custom Gateway URL (uncomment if needed)
# AI_GATEWAY_BASE_URL=https://your-custom-gateway.example.com
```

### Incorrect Configurations

❌ **Don't use provider-specific keys:**
```bash
OPENAI_API_KEY=sk-...
GOOGLE_GENERATIVE_AI_API_KEY=AI...
```

❌ **Don't mix Gateway and provider keys:**
```bash
AI_GATEWAY_API_KEY=your_key
OPENAI_API_KEY=sk-...  # This will be ignored!
```

## Migration Guide

If you currently have provider-specific keys in your `.env.local`:

1. **Get a Gateway API Key**:
   - Visit [Vercel AI Gateway](https://vercel.com/docs/ai-gateway)
   - Create an account and generate an API key

2. **Update your .env.local**:
   ```bash
   # Remove these lines:
   # OPENAI_API_KEY=...
   # GOOGLE_GENERATIVE_AI_API_KEY=...

   # Add this line:
   AI_GATEWAY_API_KEY=your_gateway_key_here
   ```

3. **Restart your development server**:
   ```bash
   pnpm dev
   ```

4. **Verify it works**:
   - Navigate to `http://localhost:3000`
   - Test AI functionality
   - All providers (OpenAI, Gemini) should work with the single Gateway key

## Benefits of Gateway-Only Authentication

### For Development

- Faster setup (one key instead of multiple)
- Consistent behavior across providers
- Easier debugging (single authentication path)

### For Production

- Centralized credential management
- Better security (fewer secrets to manage)
- Unified monitoring and rate limiting
- Simplified deployment (one environment variable)

## Troubleshooting

### Error: "AI_GATEWAY_API_KEY is required"

**Solution**: Set `AI_GATEWAY_API_KEY` in your `.env.local` file:

```bash
cp .env.example .env.local
# Edit .env.local and add your Gateway API key
```

### Error: "Provider-specific keys are no longer supported"

**Solution**: Remove old provider keys and use Gateway:

```bash
# In .env.local, remove:
# OPENAI_API_KEY=...
# GOOGLE_GENERATIVE_AI_API_KEY=...

# Add:
AI_GATEWAY_API_KEY=your_gateway_key
```

### AI features not working after migration

**Check**:
1. Is `AI_GATEWAY_API_KEY` set in `.env.local`?
2. Did you restart the dev server after changing `.env.local`?
3. Is your Gateway API key valid?

```bash
# Verify environment variable is loaded:
pnpm dev
# Then check the terminal for any authentication errors
```

## See Also

- [.env.example](../.env.example) - Environment variable template
- [Vercel AI Gateway Docs](https://vercel.com/docs/ai-gateway) - Official documentation
- [LOCAL_SETUP.md](./LOCAL_SETUP.md) - Complete setup guide (Story 007)