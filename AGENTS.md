# Repository Guidelines

## Project Structure & Module Organization
- Monorepo managed by pnpm; main Next.js App Router app under `apps/x-reason-web/src/app`.
- UI building blocks in `apps/x-reason-web/src/app/components`; reusable variants live in `components/ui`.
- Higher-level templates in `apps/x-reason-web/src/app/templates`; server logic distributed across `actions`, `api`, and `lib`.
- Shared utilities sit in `apps/x-reason-web/src/app/utils`; React context under `context`; static assets in `apps/x-reason-web/public/`.
- Jest specs reside in `apps/x-reason-web/src/app/test`; config in `apps/x-reason-web/jest.config.js`.

## AI Provider Architecture
- **Unified Provider Layer**: All AI interactions go through Vercel AI SDK (`ai`, `@ai-sdk/openai`, `@ai-sdk/google`)
- **Centralized Configuration**: Provider setup in `apps/x-reason-web/src/app/api/ai/providers.ts`
- **Server-Side Only**: API keys managed via environment variables (`.env.local`), never exposed to client
- **Supported Providers**:
  - OpenAI: o4-mini, o3-mini, gpt-4.1-mini, gpt-4.1-nano
  - Google Gemini: gemini-2.0-flash, gemini-2.5-flash, gemini-2.5-flash-lite, gemini-2.5-pro
- **API Routes**: Unified `/api/ai/chat` endpoint replaces legacy `/api/openai/` and `/api/gemini/` paths

## Build, Test, and Development Commands
- `pnpm dev`: launch local Next.js dev server at `http://localhost:3000`.
- `pnpm build`: compile production bundle via `next build`.
- `pnpm start`: run optimized build in production mode.
- `pnpm lint [-- --fix]`: execute ESLint (Next.js config) and optionally auto-fix.
- `pnpm test`: run Jest suite; set `CI=true` to surface snapshot and coverage regressions.

## Coding Style & Naming Conventions
- TypeScript/React with 2-space indentation and named exports for shared modules.
- Favor functional components, Tailwind utility classes, shadcn/ui + Radix primitives.
- Component filenames use lowercase-hyphen (`button-group.tsx`); helpers use camelCase.
- Maintain Tailwind Merge class ordering; keep global styles in `globals.css`.

## Testing Guidelines
- Use Jest with Testing Library (`ts-jest`); place tests alongside mirrored names in `apps/x-reason-web/src/app/test` using `*.test.ts`.
- Cover new logic in `actions` or `lib`; expand edge-case assertions over broad snapshots.
- Default timeout is 120s for AI-related tests—respect this when writing async specs.
- **AI Provider Testing**: Mock Vercel AI SDK functions (`streamText`, `generateText`) instead of provider-specific SDKs
- **Mock Data**: Use mock responses for deterministic testing; avoid live API calls in unit tests

## Commit & Pull Request Guidelines
- Write concise, imperative commit subjects (e.g., `feat: add reasoning demo toggles`).
- PR descriptions should explain user-facing impact, list tests run, and link issues.
- Include screenshots or clips when UI shifts; note intentional skips for lint/test.

## Tooling Notes
- Prefer `rg` for searches and `fd` for file discovery; avoid slower `grep`/`find`.
- Rely on workspace scripts from repo root; refrain from mutating directories outside allowed roots without approval.
