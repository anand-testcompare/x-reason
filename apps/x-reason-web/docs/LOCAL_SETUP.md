# Local Development Setup Guide

This guide walks you through setting up your local development environment for X-Reason.

## Prerequisites

- Node.js 18+ installed
- pnpm package manager
- Git

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd x-reason

# Install dependencies
pnpm install
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp apps/x-reason-web/.env.example apps/x-reason-web/.env.local
```

### 3. Get Your AI Gateway API Key

Visit [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) to:
1. Create an account (if you don't have one)
2. Generate an API key
3. Copy the key

### 4. Update .env.local

Open `apps/x-reason-web/.env.local` and add your API key:

```bash
# Replace with your actual key
AI_GATEWAY_API_KEY=your_actual_gateway_key_here
```

⚠️ **IMPORTANT**: Never commit `.env.local` to git! It contains your personal API keys.

### 5. Start Development Server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app.

## Verification Checklist

Use this checklist to verify your setup is correct:

- [ ] `.env.local` exists in `apps/x-reason-web/`
- [ ] `AI_GATEWAY_API_KEY` is set with your actual key (not the placeholder)
- [ ] `.env.local` is NOT tracked in git (run `git status` to verify)
- [ ] `pnpm dev` starts successfully without errors
- [ ] You can navigate to `http://localhost:3000`
- [ ] AI features work (try the reasoning engine or chat)

### Quick Verification Commands

```bash
# Verify .env.local exists
ls apps/x-reason-web/.env.local

# Verify .env.local is not tracked by git
git ls-files | grep -E '\.env.*local'
# Should return nothing

# Verify environment variable is loaded (shows redacted value)
pnpm dev
# Check terminal output for "Using AI Gateway" or similar message
```

## Troubleshooting

### Error: "AI_GATEWAY_API_KEY is required"

**Problem**: The application can't find your API key.

**Solutions**:

1. Verify `.env.local` exists:
   ```bash
   ls apps/x-reason-web/.env.local
   ```

2. Check that `AI_GATEWAY_API_KEY` is set:
   ```bash
   cat apps/x-reason-web/.env.local | grep AI_GATEWAY_API_KEY
   ```

3. Ensure there are no typos in the variable name

4. Restart the development server after changing `.env.local`

### Error: "Provider-specific keys are no longer supported"

**Problem**: You're using old environment variable names.

**Solution**: Remove old provider keys and use Gateway key:

```bash
# In .env.local, remove these lines:
# OPENAI_API_KEY=...
# GOOGLE_GENERATIVE_AI_API_KEY=...

# Keep only:
AI_GATEWAY_API_KEY=your_gateway_key
```

### Development Server Won't Start

1. Check for port conflicts (default: 3000):
   ```bash
   lsof -i :3000
   ```

2. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules
   pnpm install
   ```

3. Verify you're in the correct directory:
   ```bash
   pwd
   # Should show: /path/to/x-reason
   ```

### AI Features Not Working

1. **Verify API key is valid**:
   - Check that your Gateway API key is active in Vercel dashboard
   - Try generating a new key

2. **Check console for errors**:
   - Open browser DevTools (F12)
   - Look for authentication or API errors

3. **Verify environment variable is loaded**:
   - Restart development server
   - Check terminal for startup messages

4. **Test with simple prompt**:
   - Try a basic AI feature (chat, reasoning)
   - Check if error message provides specific guidance

## Security Best Practices

### ✅ DO

- Keep `.env.local` out of version control (already configured in `.gitignore`)
- Use unique API keys for each developer
- Rotate API keys periodically
- Store production keys in secure secret management systems
- Review `.gitignore` before committing

### ❌ DON'T

- Never commit `.env.local` to git
- Never share API keys in chat, email, or screenshots
- Never hardcode API keys in source code
- Never push API keys to public repositories

## What to Do If You Accidentally Committed Secrets

If you've accidentally committed `.env.local` or any file with secrets:

1. **Stop immediately** - Don't push if you haven't yet

2. **Rotate the exposed keys**:
   - Generate new API keys in Vercel Gateway
   - Invalidate the old keys

3. **Remove from git history** (if already pushed):
   ```bash
   # WARNING: This rewrites history and requires force push
   # Coordinate with your team before doing this

   # Remove file from history
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch apps/x-reason-web/.env.local" \
     --prune-empty --tag-name-filter cat -- --all

   # Force push (dangerous - coordinate with team)
   git push origin --force --all
   ```

4. **Notify your team** - Others may have pulled the compromised keys

5. **Document the incident** - Learn from the mistake

## Additional Resources

- [ENV_CONFIG.md](./ENV_CONFIG.md) - Detailed environment configuration
- [Vercel AI Gateway Docs](https://vercel.com/docs/ai-gateway) - Official Gateway documentation
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables) - Next.js env var guide

## Development Workflow

### Daily Workflow

```bash
# Pull latest changes
git pull

# Install any new dependencies
pnpm install

# Start development server
pnpm dev

# Make changes...

# Run linting
pnpm lint

# Run tests
pnpm test

# Build for production (local verification)
pnpm build
```

### Project Structure

```
x-reason/
├── apps/
│   └── x-reason-web/
│       ├── .env.example       # Template (committed to git)
│       ├── .env.local         # Your secrets (NOT committed)
│       ├── src/
│       └── docs/
│           ├── ENV_CONFIG.md      # Environment configuration guide
│           └── LOCAL_SETUP.md     # This file
├── packages/
│   └── x-reason/
└── pnpm-workspace.yaml
```

## Need Help?

- Check [ENV_CONFIG.md](./ENV_CONFIG.md) for environment variable details
- Review error messages carefully - they often include solutions
- Check the project README for additional documentation
- Ask your team for help with setup issues

---

**Last Updated**: Story 007 - Security verification and local setup guide