# Repository Guidelines

## Project Structure & Module Organization
The application is a Next.js App Router project rooted in `src/app`. UI building blocks live in `src/app/components`, while higher-level flows and templates sit in `src/app/templates`. Server-side logic and integrations are grouped under `src/app/actions`, `src/app/api`, and `src/app/lib`. Shared utilities reside in `src/app/utils`, and React context is defined in `src/app/context`. Static assets go in `public/`, global styles live in `src/app/globals.css`, and Jest unit tests are collected in `src/app/test` with the supporting config in `jest.config.js`.

## Build, Test, and Development Commands
Use the package scripts consistently:
- `npm run dev` (or `pnpm dev`) starts the local server on `http://localhost:3000`.
- `npm run build` compiles the production bundle via `next build`.
- `npm run start` serves the optimized build.
- `npm run lint` runs the Next.js ESLint pipeline; add `-- --fix` to auto-format.
- `npm run test` executes the Jest suite; set `CI=true` to surface snapshot/coverage regressions.

## Coding Style & Naming Conventions
TypeScript and React files default to 2-space indentation and named exports for shared modules. Favor functional React components and Tailwind utility classes for styling; reusable variants belong in `components/ui`. Keep filenames lowercase with hyphens for components (`button-group.tsx`) and camelCase for helpers. ESLint (`eslint-config-next`) and TypeScript are mandatory gatekeepers—run linting before opening a PR. Tailwind class order should follow the Tailwind Merge conventions already used in `globals.css`.

## Testing Guidelines
Jest with `ts-jest` and Testing Library powers unit tests. Place specs in `src/app/test` using the `*.test.ts` suffix and mirror the module naming (`stateMachineUtilities.test.ts`). Prefer component tests that assert accessible roles and minimal DOM coupling. New logic in `actions` or `lib` should arrive with matching tests; aim to keep coverage steady by expanding edge-case assertions rather than relying on broad snapshots.

## Commit & Pull Request Guidelines
Craft concise, imperative commit subjects (e.g., `feat: add reasoning demo toggles`). Group related changes and avoid multi-purpose commits. PRs should explain the user-facing outcome, list testing performed, and link any tracked issues. Include screenshots or short clips when UI behavior shifts. Run `npm run lint` and `npm run test` before requesting review, noting any intentional skips in the description.
