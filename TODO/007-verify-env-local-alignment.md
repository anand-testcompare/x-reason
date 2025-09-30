# Story 007 — Security: Verify .env.local Alignment and Prevent Secret Commits

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [ ] Done (delete this story file after completion)

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

## Intent

Ensure local environment configuration aligns with Gateway-only authentication and verify that no secrets can be accidentally committed to the repository. This is a safety check and documentation task.

## Scope and guardrails

- Audit-only task; no code changes required
- Verify `.gitignore` properly excludes `.env.local` and other secret files
- Document recommended `.env.local` structure for developers
- Create a checklist for developers to verify their local setup
- Do NOT commit any actual secrets or environment files

## What to do

1. Verify `.gitignore` includes proper exclusions:
   ```gitignore
   .env.local
   .env*.local
   .env.development.local
   .env.test.local
   .env.production.local
   ```

2. Check if any `.env.local` or similar files are tracked in git:
   ```bash
   git ls-files | grep -E '\.env.*local'
   ```

3. If any environment files are tracked, create instructions to remove them:
   ```bash
   git rm --cached .env.local
   git commit -m "Remove accidentally committed environment file"
   ```

4. Create a developer checklist document: `apps/x-reason-web/docs/LOCAL_SETUP.md`
   - Steps to set up `.env.local` correctly
   - How to verify AI_GATEWAY_API_KEY is working
   - Common troubleshooting tips
   - What to do if secrets were accidentally committed

5. Add a note to `.env.example` about `.env.local`:
   ```bash
   # IMPORTANT: Never commit .env.local to git!
   # It is excluded via .gitignore and contains your personal API keys
   ```

6. Document the correct `.env.local` structure:
   ```bash
   # apps/x-reason-web/.env.local (DO NOT COMMIT)
   AI_GATEWAY_API_KEY=your_actual_gateway_key_here
   # Optional: AI_GATEWAY_BASE_URL=custom_gateway_url
   ```

## Acceptance criteria (what success looks like)

- `.gitignore` properly excludes all `.env.local` variants
- No environment files with secrets are tracked in git history
- `docs/LOCAL_SETUP.md` exists with clear setup instructions
- `.env.example` includes warning about never committing `.env.local`
- Developer checklist covers setup, verification, and troubleshooting
- Documentation includes steps to fix accidental secret commits
- Verification command provided to check for tracked environment files

## Lightweight tests to add (1–2 minimum)

No runtime tests needed, but include verification commands:
- Test 1: `git ls-files | grep -E '\.env.*local'` should return empty
- Test 2: `git status` should never show `.env.local` as staged or modified

Add to documentation as manual verification steps.

## Steps to implement

1) Check `.gitignore` for `.env.local` exclusions:
   ```bash
   cat .gitignore | grep -E '\.env'
   ```

2) Verify no environment files are tracked:
   ```bash
   git ls-files | grep -E '\.env.*local'
   ```

3) If tracked files found, document removal steps (but do NOT execute - developer must review first)

4) Create `apps/x-reason-web/docs/LOCAL_SETUP.md` with:
   - Initial setup steps
   - How to get AI_GATEWAY_API_KEY
   - How to create and configure `.env.local`
   - Verification commands
   - Troubleshooting common issues
   - What to do if secrets committed accidentally

5) Add warning comment to `.env.example`

6) Document recommended `.env.local` structure in LOCAL_SETUP.md

7) Create a "verify your setup" checklist:
   - [ ] `.env.local` exists in `apps/x-reason-web/`
   - [ ] `AI_GATEWAY_API_KEY` is set with real value
   - [ ] `.env.local` is NOT tracked in git
   - [ ] `pnpm dev` starts successfully
   - [ ] AI features work at `http://localhost:3000`

## No-regression verification

- Run:
  - `pnpm lint` (should pass)
  - `pnpm test` (should pass)
  - `pnpm build` (should succeed)
- Manual:
  - Verify `.gitignore` excludes `.env.local`: `git status` should not show `.env.local`
  - Check no secrets in git: `git log --all --full-history --source --extra=all --oneline -- '*env.local*'`
  - Test LOCAL_SETUP.md instructions by following them on a fresh clone

## Out of scope

- Removing secrets from git history (requires git-filter-branch or BFG, risk of data loss)
- Updating CI/CD secret management (separate task)
- Configuring production environment variables (deployment-specific)
- Implementing pre-commit hooks to prevent secret commits

## Estimate

S (audit and documentation task)

## Links

- `.gitignore` - Verify exclusions
- `apps/x-reason-web/.env.example` - Add warnings
- `apps/x-reason-web/docs/LOCAL_SETUP.md` - Create setup guide

## Dependencies

- Story 006 (.env.example update) - completed (informs LOCAL_SETUP.md)

## Notes for implementer

Security is critical. If any secrets are found in git history, document the finding and recommend professional remediation. Do not attempt automated removal without explicit approval. The LOCAL_SETUP.md document should be beginner-friendly and include visual verification steps.