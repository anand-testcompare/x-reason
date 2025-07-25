<div align="center">
  <img src="public/icon_cherry_blossom.png" alt="X-Reason Logo" width="200" height="200">
  
  # Dynamic AI-Generated Software Flows
  
  <p align="center">
    <strong>Transform natural language into executable software workflows</strong>
  </p>
</div>

A Next.js application that demonstrates dynamic AI-generated software flows using XState state machines. This project showcases how AI can dynamically assemble software from task lists and execute them as state machines, applying dynamic programming principles to LLM reasoning tasks.

## Table of Contents

- [Overview](#overview)
- [Video Demo](#video-demo)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running the Application](#running-the-application)
- [Architecture](#architecture)
  - [Core Components](#core-components)
  - [AI Provider Integration](#ai-provider-integration)
  - [State Machine System](#state-machine-system)
- [How It Works](#how-it-works)
- [Recent Enhancements](#recent-enhancements)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [Development Status](#development-status)
- [License](#license)

## Overview

X-Reason is an innovative prototype that demonstrates how AI can dynamically assemble and execute software workflows. By converting AI-generated task lists into executable XState machines, it enables non-technical users to compose software through natural language descriptions.

## Video Demo

<div align="center">
  <a href="http://www.youtube.com/watch?v=GqnSI1DDJe4" title="X-Reason: Dynamic AI Generated Software Flows with X-State!">
    <img src="https://img.youtube.com/vi/GqnSI1DDJe4/0.jpg" alt="X-Reason Demo Video" width="560" height="315">
  </a>
</div>

## Features

- **Dynamic State Machine Generation**: Convert AI-generated task lists into executable XState machines
- **Multi-AI Provider Support**: Seamlessly switch between OpenAI and Google Gemini
- **Real-time Streaming**: Server-sent events for live AI response streaming
- **Domain-Specific Workflows**: Pre-built demos for chemical engineering (Chemli) and user registration (Regie)
- **Modern UI**: Tailwind CSS with shadcn/ui components for a clean, responsive interface
- **Human-in-the-Loop**: Support for pause/resume execution with user interaction
- **Persistent Context**: Maintain state across execution steps
- **Visual Debugging**: State machine visualizer for understanding workflow execution

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- API keys for at least one AI provider:
  - OpenAI API key
  - Google Generative AI API key (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/x-reason.git
cd x-reason
```

2. Install dependencies:
```bash
pnpm install
# or
npm install
```

### Configuration

Create a `.env.local` file in the root directory and add your API keys:

```bash
# Required - at least one provider
OPENAI_API_KEY=your_openai_key_here

# Optional - additional provider
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key_here
```

### Running the Application

Start the development server:

```bash
pnpm run dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Other available commands:

```bash
# Build for production
pnpm run build

# Run production server
pnpm start

# Run tests
pnpm test

# Lint code
pnpm run lint
```

## Architecture

### Core Components

1. **State Machine Macro System** (`src/app/actions/statesMacros.ts`)
   - Converts task maps to XState configurations
   - Supports pause/resume execution
   - Maintains context across execution steps
   - Enables real-time streaming support

2. **AI Provider System** (`src/app/api/ai/`)
   - Unified interface for multiple AI providers
   - Provider-specific adapters
   - Streaming response support
   - Automatic fallback handling

3. **Domain-Specific Components**
   - **Chemli** (`src/app/components/chemli/`): Chemical product engineering workflows
   - **Regie** (`src/app/components/regie/`): Dynamic user registration flows

### AI Provider Integration

The application supports multiple AI providers through a unified SDK:

- **OpenAI**: o4-mini, o3-mini, gpt-4.1-mini, gpt-4.1-nano
- **Google**: Gemini 2.0 Flash, Gemini 2.5 Flash, Gemini 2.5 Flash Lite, Gemini 2.5 Pro

Providers can be switched at runtime using the AI Provider Selector component.

### State Machine System

Built on XState v5, the system provides:

- Dynamic state machine generation from task lists
- Error handling with retry mechanisms
- Context preservation across states
- Support for long-running async operations
- Human-in-the-loop interactions

## How It Works

X-Reason transforms natural language descriptions into executable software flows:

1. **Task Generation**: AI analyzes user requirements and generates an optimized task list
2. **State Machine Creation**: The macro system converts tasks into XState configurations
3. **Execution**: The state machine executes tasks sequentially with support for:
   - User interactions
   - External system callbacks
   - Async operations (data persistence, notifications)
4. **Adaptation**: AI can modify flows based on context and user behavior

### Example: Dynamic User Registration

The system can generate customized registration flows based on user context:

```typescript
// AI analyzes user context (location, visit frequency, etc.)
// and generates an optimized task list:
[
  "Collect User Details",
  "Age Confirmation",    // Added for US/Canada users
  "Present Special Offers", // Added for frequent visitors
  "Select Plan",
  "TOS Acceptance",
  "Persist User Details",
  "Send Registration Event"
]

// The macro converts this to an executable state machine
const registrationMachine = machineMacro(taskMap);
```

## Recent Updates

- **Next.js 15**: Upgraded from v14 with Turbopack support
- **XState v5**: Migrated from v4 with improved APIs
- **Multi-AI Providers**: Added Google Gemini alongside OpenAI
- **Modern UI**: Replaced Blueprint.js with Tailwind CSS + shadcn/ui
- **Streaming**: Real-time AI responses via Server-Sent Events
- **Enhanced DX**: Better TypeScript support and error handling

## API Documentation

### AI Endpoints

- `POST /api/ai/chat` - Unified chat endpoint for all providers
- `POST /api/ai/stream` - Streaming responses endpoint
- `GET /api/ai/providers` - List available providers

### State Machine API

- `POST /api/state-machine/create` - Generate state machine from task list
- `POST /api/state-machine/execute` - Execute state machine with context
- `GET /api/state-machine/status/:id` - Get execution status

## Contributing

<table>
  <tr>
    <td valign="top" width="100">
      <img src="public/icon_cherry_blossom_small.png" alt="X-Reason" width="80" height="80">
    </td>
    <td valign="top">
      <h3>Top Contributors</h3>
      <ul>
        <li><a href="https://github.com/doriansmiley">@doriansmiley</a> (Dorian Smiley) - Creator of core engine</li>
        <li><a href="https://github.com/anand-testcompare">@anand-testcompare</a> (Anand Pant) - Revamped UI/UX and expanded use cases</li>
      </ul>
      <p>We welcome contributions! Please see our <a href="CONTRIBUTING.md">Contributing Guide</a> for details.</p>
    </td>
  </tr>
</table>

## Development Status

**⚠️ This is a prototype/demonstration application, not production-ready!**

Expect bugs and breaking changes. The focus is on showcasing innovative AI-driven software composition patterns rather than production stability.

### Known Issues

- Some TODO items remain in the codebase
- Limited error recovery in certain edge cases

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.