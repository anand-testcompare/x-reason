# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

X-Reason is a monorepo containing a Next.js 15 application that demonstrates dynamic AI-generated software flows using XState state machines. The project showcases how AI can dynamically assemble software from task lists and execute them as state machines, applying dynamic programming principles to LLM reasoning tasks.

The project follows a monorepo structure with:
- `apps/x-reason-web/` - Main Next.js web application
- `packages/x-reason/` - Shared package for common utilities
- Workspace managed by pnpm

## Development Commands

```bash
# Development server
pnpm dev

# Build for production
pnpm build

# Run production server
pnpm start

# Linting
pnpm lint

# Testing
pnpm test
```

### Setup Requirements
- Requires OpenAI API key in `.env.local` (in apps/x-reason-web/)
- Uses pnpm workspace with monorepo structure
- Development server runs on `http://localhost:3000`

## Technical Stack

- **Framework**: Next.js 15.4.3 with App Router
- **Package Manager**: pnpm with workspace configuration
- **Language**: TypeScript with strict configuration
- **State Management**: XState 5.20.1 for state machine execution
- **UI**: Tailwind CSS with shadcn/ui components and Radix UI primitives
- **AI Integration**: Multiple providers (OpenAI, Google) with custom API routes
- **Testing**: Jest with Testing Library (configured for 120s timeout)
- **Utilities**: Ramda for functional programming, class-variance-authority for styling
- **Streaming**: Server-sent events for real-time AI responses

## Core Architecture

### AI-Driven State Machine Generation
The application converts AI-generated task lists into executable XState machines through the State Machine Macro system (`apps/x-reason-web/src/app/actions/statesMacros.ts`). This enables dynamic software composition from natural language descriptions.

### Key Architectural Components

1. **State Machine Macro System** (`apps/x-reason-web/src/app/actions/statesMacros.ts`):
   - Converts task maps to XState configurations
   - Supports pause/resume execution for user interaction
   - Maintains context across execution steps
   - Real-time streaming support for AI responses

2. **Multi-Provider AI Integration**:
   - Custom API routes for different AI providers
   - Supports OpenAI and Google Gemini
   - Streaming responses with Server-Sent Events
   - Provider-specific request handlers

3. **Domain-Specific Components**:
   - **Chemli**: Chemical product engineering workflows (`apps/x-reason-web/src/app/components/chemli/`)
   - **Regie**: User registration flows (`apps/x-reason-web/src/app/components/regie/`)
   - Both support streaming AI responses with real-time updates

4. **Modern UI Architecture**:
   - Tailwind CSS for styling with shared configuration
   - shadcn/ui components with Radix UI primitives
   - Responsive navigation with mobile support
   - Component library in `apps/x-reason-web/src/app/components/ui/`

### Directory Structure

```
apps/x-reason-web/src/app/
├── actions/           # XState machine generation and execution logic
├── api/               # API routes for AI providers and reasoning engines
│   ├── ai/            # Unified AI provider abstraction
│   ├── openai/        # OpenAI integration (chat, assistants)
│   ├── gemini/        # Google Gemini integration
│   ├── reasoning/     # Core reasoning engine with detailed documentation
│   ├── credentials/   # API credential validation
│   └── regie/         # Registration-specific API routes
├── components/        # React components organized by domain
│   ├── chemli/        # Chemical product engineering UI
│   ├── regie/         # User registration flow UI
│   ├── storage/       # Local storage utilities
│   └── ui/            # shadcn/ui component library
├── context/           # React context providers for state management
├── lib/               # Library utilities (inspector, etc.)
├── pages/             # Page components for different routes
├── templates/         # Template definitions and hooks
├── test/              # Jest unit tests
└── utils/             # Utility functions and helpers

packages/x-reason/     # Shared package for common utilities
```

## Important Technical Details

### State Machine Execution
- Machines support pause/resume functionality for human-in-the-loop workflows
- Built-in error handling with retry mechanisms
- Context preservation across execution steps
- Test coverage in `apps/x-reason-web/src/app/actions/statesMacros.test.ts`

### Configuration Files
- **Jest**: Custom configuration with 120-second timeout for AI operations (in apps/x-reason-web/)
- **Next.js**: Minimal config in apps/x-reason-web/next.config.js
- **TypeScript**: Workspace configuration with path mapping
- **pnpm**: Workspace configuration in pnpm-workspace.yaml
- **Environment Variables**: Support for multiple AI providers (OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY)

### Documentation
- Core reasoning engine documentation: `apps/x-reason-web/src/app/api/reasoning/README.md`
- Domain-specific workflows: `apps/x-reason-web/src/app/api/reasoning/solver.md`
- Business value and technical approach details included in reasoning engine docs

## Recent Enhancements

- **Monorepo Structure**: Migrated to pnpm workspace-based monorepo
- **Multi-AI Provider Support**: Custom API routes for OpenAI and Google Gemini
- **Streaming Responses**: Real-time streaming AI responses with Server-Sent Events
- **UI Modernization**: Tailwind CSS with shadcn/ui and Radix UI primitives
- **Improved Navigation**: Responsive navigation with mobile support
- **Next.js 15 Upgrade**: Updated to Next.js 15.4.3
- **Enhanced Type Safety**: Workspace TypeScript configurations and type definitions

## Development Status

This is a prototype/demonstration application, not production-ready. Expect bugs and breaking changes during development. The focus is on showcasing innovative AI-driven software composition patterns.