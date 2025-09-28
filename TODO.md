# TODO

## Externalize x-reason implementation
- Inventory the current x-reason-specific modules under `src/app` (components, actions, utils, context) and map each to the surface API that must remain available to the app.
- Add `@codestrap/developer-foundations-x-reason` (and any documented peer dependencies) to `package.json`, then run the chosen package manager install to refresh `package-lock.json`/`pnpm-lock.yaml`.
- Replace local imports with the package entry points, creating lightweight local wrappers only where we need to adapt props or maintain tree-shakeable boundaries.
- Remove or deprecate redundant in-repo implementations (`src/app/components`, `src/app/actions`, `src/app/lib`, etc.) once their responsibilities are covered by the external package.
- Update Jest and tsconfig path aliases so tests and TypeScript resolve the new package correctly; prune tests that strictly validated deleted internals and backfill coverage at the integration surface instead.
- Run `npm run lint` and `npm run test` to verify the integration, addressing any gaps surfaced by the new dependency tree.

## Prep for monorepo alignment
- Introduce an `apps/x-reason-web` folder (or equivalent) and relocate the Next.js App Router project there, wiring workspace tooling (Nx package.json/project.json) to match the target monorepo layout.
- Create `packages/x-reason` as a thin façade that re-exports from `@codestrap/developer-foundations-x-reason`, keeping room for future monorepo-specific extensions without forking upstream code.
- Update root-level configs (`tsconfig.base.json`, lint presets, Jest configs, Tailwind config) to reference the new `apps`/`packages` paths and ensure path aliases remain valid after the move.
- Adjust CI scripts and developer docs (README, CHANGELOG, publishing instructions) so they reflect the new workspace commands and dependency sourcing.
- Verify build and runtime by running `nx build x-reason-web` (or the equivalent workspace command) and smoke-testing the app to catch regressions introduced by the structural refactor.

## Follow-up cleanup
- Remove orphaned assets, stories, and configuration files that belonged solely to the in-repo x-reason implementation.
- Update environment variable scaffolding and secrets management to align with the external package’s expectations.
- Capture any new upstream issues or gaps discovered during migration so they can be raised against `@codestrap/developer-foundations-x-reason` rather than patched locally.
