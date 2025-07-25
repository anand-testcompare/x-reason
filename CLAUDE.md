# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

X-Reason is a Next.js 15 application that demonstrates dynamic AI-generated software flows using XState state machines. The project showcases how AI can dynamically assemble software from task lists and execute them as state machines, applying dynamic programming principles to LLM reasoning tasks.

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Linting
npm run lint

# Testing
npm test
```

### Setup Requirements
- Requires OpenAI API key in `.env.local`
- Mixed package management (both npm and pnpm lock files present) - prefer npm for consistency
- Development server runs on `http://localhost:3000`

## Technical Stack

- **Framework**: Next.js 15.2.10 with App Router
- **Language**: TypeScript with strict configuration
- **State Management**: XState 5.20.1 for state machine execution
- **UI**: Tailwind CSS with shadcn/ui components (replaced Blueprint.js)
- **AI Integration**: Multiple providers (OpenAI, Google) via unified AI SDK
- **Testing**: Jest with Testing Library (120s timeout configured)
- **Utilities**: Ramda for functional programming, EJS for templating
- **Streaming**: Server-sent events for real-time AI responses

## Core Architecture

### AI-Driven State Machine Generation
The application converts AI-generated task lists into executable XState machines through the State Machine Macro system (`src/app/actions/statesMacros.ts`). This enables dynamic software composition from natural language descriptions.

### Key Architectural Components

1. **State Machine Macro System** (`src/app/actions/statesMacros.ts`):
   - Converts task maps to XState configurations
   - Supports pause/resume execution for user interaction
   - Maintains context across execution steps
   - Real-time streaming support for AI responses

2. **Multi-Provider AI Integration**:
   - Unified AI SDK for seamless provider switching
   - Supports OpenAI, Anthropic Claude, and Google Gemini
   - Streaming responses with Server-Sent Events
   - Configurable via environment variables

3. **Domain-Specific Components**:
   - **Chemli**: Chemical product engineering workflows (`src/app/components/chemli/`)
   - **Regie**: User registration flows (`src/app/components/regie/`)
   - Both support streaming AI responses with real-time updates

4. **Modern UI Architecture**:
   - Tailwind CSS for styling
   - shadcn/ui components for consistent design
   - Responsive navigation with mobile support
   - Clean, modern interface replacing Blueprint.js

### Directory Structure

```
src/app/
├── actions/           # XState machine generation and execution logic
├── api/               # API routes for OpenAI and reasoning engines
│   ├── openai/        # OpenAI integration (chat, assistants)
│   └── reasoning/     # Core reasoning engine with detailed documentation
├── components/        # React components organized by domain
│   ├── chemli/        # Chemical product engineering UI
│   ├── regie/         # User registration flow UI
│   └── storage/       # Local storage utilities
├── context/           # React context providers for state management
├── templates/         # Template definitions
└── utils/             # Utility functions and helpers
```

## Important Technical Details

### State Machine Execution
- Machines support pause/resume functionality for human-in-the-loop workflows
- Built-in error handling with retry mechanisms
- Context preservation across execution steps
- Test coverage in `src/app/actions/statesMacros.test.ts`

### Configuration Files
- **Jest**: Custom configuration with 120-second timeout for AI operations
- **Next.js**: Minimal config with Ramda transpilation for Jest compatibility
- **TypeScript**: Standard Next.js configuration with path mapping
- **Environment Variables**: Support for multiple AI providers (OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY)

### Documentation
- Core reasoning engine documentation: `src/app/api/reasoning/README.md`
- Domain-specific workflows: `src/app/api/reasoning/solver.md`
- Business value and technical approach details included in reasoning engine docs

## Recent Enhancements

- **Multi-AI Provider Support**: Integrated unified AI SDK supporting OpenAI, Anthropic, and Google
- **Streaming Responses**: Real-time streaming AI responses with Server-Sent Events
- **UI Modernization**: Replaced Blueprint.js with Tailwind CSS and shadcn/ui
- **Improved Navigation**: Responsive navigation with mobile support
- **Next.js 15 Upgrade**: Updated to latest Next.js with Turbopack support
- **Enhanced Type Safety**: Improved TypeScript configurations and type definitions

## Development Status

This is a prototype/demonstration application, not production-ready. Expect bugs and breaking changes during development. The focus is on showcasing innovative AI-driven software composition patterns.