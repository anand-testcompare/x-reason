# x-reason Agents

A small set of Claude agents tuned for this repository. They help keep docs accurate, plan work from the central TODO, and capture screenshots deterministically for visual documentation.

## Prerequisites
- Run from repo root
- Local dev: `pnpm dev` → app on `http://localhost:3000`
- Lint: `pnpm lint`
- Test: `pnpm test`
- Build: `pnpm build`

## Available Agents

### `story-decomposition-agent`
- Decomposes `TODO.md` into numbered, implementation-ready stories under `./TODO/`.
- Each story includes intent, steps, acceptance, and Jest test suggestions.
- Verification block: `pnpm lint && pnpm test && pnpm build`.

Run examples:
```bash
claude-agent story-decomposition-agent
claude-agent story-decomposition-agent --todo="docs/TODO.md" --outDir="planning/TODO"
```

### `screenshot-documentation-agent`
- Uses Chrome DevTools MCP to collect deterministic screenshots and a minimal report after UI changes.
- Navigates via semantic roles/text, captures console messages, and saves artifacts in `screenshots/`.

Usage:
```bash
pnpm dev  # ensure app is running at http://localhost:3000
# then invoke the agent via your Claude runner with DevTools MCP enabled
```

### `ci-visual-docs-generator`
- Produces sequential screenshots and a markdown report for CI using Chrome DevTools MCP.
- Artifacts: `screenshots/*.png`, `screenshots/visual-documentation-report.md`.

## Conventions
- Prefer mock-data-first; add API routes and commit `.json` or `.csv` samples when needed.
- Keep waits semantic (text/roles) for stability.
- Keep stories and screenshots minimal and specific to current demos.

## Notes
- This repo does not rely on Playwright MCP; Chrome DevTools MCP is the documented path.
- All commands are routed through repo-level `pnpm` scripts.
