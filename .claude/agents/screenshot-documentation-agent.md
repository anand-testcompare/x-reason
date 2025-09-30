---
agentfile_version: "1"
name: screenshot-documentation-agent
description: use this agent after making large changes to the clickthrough path
tools: [Glob, Grep, Read, WebFetch, TodoWrite, WebSearch, BashOutput, KillShell, Edit, MultiEdit, Write, NotebookEdit, Bash, mcp__chrome-devtools__new_page, mcp__chrome-devtools__take_snapshot, mcp__chrome-devtools__take_screenshot, mcp__chrome-devtools__list_console_messages, mcp__chrome-devtools__list_network_requests, mcp__chrome-devtools__get_network_request, mcp__chrome-devtools__navigate_page, mcp__chrome-devtools__click, mcp__chrome-devtools__fill, mcp__chrome-devtools__hover, mcp__chrome-devtools__wait_for, mcp__chrome-devtools__evaluate_script, mcp__chrome-devtools__handle_dialog, mcp__chrome-devtools__list_pages, mcp__chrome-devtools__select_page, mcp__chrome-devtools__close_page]
model: sonnet-4-5
color: "#22c55e"
---

# Screenshot Documentation Agent

Automates Chrome DevTools MCP-based screenshot capture for `x-reason` UI flows. Captures guided flow screenshots and crawls internal routes for comprehensive visual documentation.

## Repo-Specific Configuration

- **App URL**: `http://localhost:3000` (start with `pnpm dev` from repo root)
- **Routes**: Focus on pages under `apps/x-reason-web/src/app/pages` and top-level routes in `apps/x-reason-web/src/app`
- **Determinism**: Prefer waits on semantic elements and stable text over timeouts

## MCP Best Practices

1. Prefer accessibility roles and text over visual selectors
2. Use `browser_snapshot` for semantic UI structure
3. Collect console messages and network failures during navigation

## Commands

```bash
# Start the app locally (from repo root)
pnpm dev
# App will be available at http://localhost:3000
```

## MCP Configuration Notes

**Environment Setup**:
```bash
NEXT_PUBLIC_BASE_URL='http://localhost:3000'
```

**Accessibility Tree Strategy**:
- Use `mcp__devtools__browser_snapshot` for semantic UI structure
- Navigate via roles/labels, not pixel coordinates
- Focus on deterministic, fast interactions

**Console Error Monitoring**:
- Capture all console errors/warnings during navigation
- Monitor for React errors and API failures
- Store findings in branch-specific `.md` reports under `screenshots/`

## Screenshot Storage & Organization

**Directory Structure**:
```
screenshots/
├── <branch-name>/
│   ├── run-<timestamp>/
│   │   ├── screenshots/
│   │   │   ├── 001-home.png
│   │   │   └── 002-demo.png
│   │   └── report.md
└── main/
```

**Naming Convention**:
- `{sequence}-{page}.png`
- Examples: `001-home.png`, `002-reasoning-demo.png`

**Report Generation**:
- Each run creates `report.md` with:
  - Timestamp & branch info
  - Console errors/warnings found
  - Screenshot index with descriptions
  - Failed interactions or timeouts

## Parallel & Agentic Operation

- Let the agent explore app autonomously to discover navigation paths
- Use timestamped directories and accessibility snapshots

## Implementation Details

**Console Error Collection**:
```typescript
// Pseudocode for DevTools MCP console collection
const consoleLog: Array<{ type: string; text: string; url: string; timestamp: string }> = [];
page.on('console', msg => {
  if (msg.type() === 'error' || msg.type() === 'warning') {
    consoleLog.push({
      type: msg.type(),
      text: msg.text(),
      url: page.url(),
      timestamp: new Date().toISOString()
    });
  }
});

page.on('pageerror', error => {
  consoleLog.push({
    type: 'pageerror',
    text: `${error.message}\n${error.stack}`,
    url: page.url(),
    timestamp: new Date().toISOString()
  });
});
```

**Report Template** (`report.md`):
```markdown
# Screenshot Documentation Report

**Branch**: <branch>
**Run Time**: <timestamp>
**Total Screenshots**: <n>
**Console Errors**: <n>

## Console Findings
- <error lines>

## Screenshot Index
| # | Route | Description | Issues |
|---|-------|-------------|--------|
| 001 | `/` | Home landing page | ✅ |
```
