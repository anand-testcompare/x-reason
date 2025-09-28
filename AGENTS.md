# Repository Guidelines

## Project Structure & Module Organization
This is a pnpm workspace monorepo with the main Next.js App Router application in `apps/x-reason-web/src/app`. UI building blocks live in `apps/x-reason-web/src/app/components`, with a dedicated UI component library in `apps/x-reason-web/src/app/components/ui`. Higher-level flows and templates sit in `apps/x-reason-web/src/app/templates`. Server-side logic and integrations are grouped under `apps/x-reason-web/src/app/actions`, `apps/x-reason-web/src/app/api`, and `apps/x-reason-web/src/app/lib`. Shared utilities reside in `apps/x-reason-web/src/app/utils`, and React context is defined in `apps/x-reason-web/src/app/context`. Static assets go in `apps/x-reason-web/public/`, global styles live in `apps/x-reason-web/src/app/globals.css`, and Jest unit tests are collected in `apps/x-reason-web/src/app/test` with the supporting config in `apps/x-reason-web/jest.config.js`. Shared packages are in `packages/`.

## Build, Test, and Development Commands
Use the workspace package scripts consistently from the root directory:
- `pnpm dev` starts the local server on `http://localhost:3000`.
- `pnpm build` compiles the production bundle via `next build`.
- `pnpm start` serves the optimized build.
- `pnpm lint` runs the Next.js ESLint pipeline; add `-- --fix` to auto-format.
- `pnpm test` executes the Jest suite; set `CI=true` to surface snapshot/coverage regressions.

All commands are proxied to the main application in `apps/x-reason-web/` via workspace configuration.

## Coding Style & Naming Conventions
TypeScript and React files default to 2-space indentation and named exports for shared modules. Favor functional React components and Tailwind utility classes for styling; reusable variants belong in `apps/x-reason-web/src/app/components/ui`. Keep filenames lowercase with hyphens for components (`button-group.tsx`) and camelCase for helpers. ESLint (`eslint-config-next`) and TypeScript are mandatory gatekeepers—run linting before opening a PR. Tailwind class order should follow the Tailwind Merge conventions already used in `apps/x-reason-web/src/app/globals.css`. Use shadcn/ui components and Radix UI primitives for consistent design patterns.

## Testing Guidelines
Jest with `ts-jest` and Testing Library powers unit tests. Place specs in `apps/x-reason-web/src/app/test` using the `*.test.ts` suffix and mirror the module naming (`stateMachineUtilities.test.ts`). Prefer component tests that assert accessible roles and minimal DOM coupling. New logic in `actions` or `lib` should arrive with matching tests; aim to keep coverage steady by expanding edge-case assertions rather than relying on broad snapshots. Jest configuration includes 120-second timeout for AI operations.

## Commit & Pull Request Guidelines
Craft concise, imperative commit subjects (e.g., `feat: add reasoning demo toggles`). Group related changes and avoid multi-purpose commits. PRs should explain the user-facing outcome, list testing performed, and link any tracked issues. Include screenshots or short clips when UI behavior shifts. Run `pnpm lint` and `pnpm test` from the workspace root before requesting review, noting any intentional skips in the description.
