# AI Streaming Support

This project supports both streaming and non-streaming AI responses using the Vercel AI SDK.

## Architecture

### Server-Side (`/api/ai/chat`)
- Uses `streamText()` for streaming responses
- Uses `generateText()` for non-streaming responses
- Returns `toTextStreamResponse()` for streaming
- Supports both `AI_GATEWAY_API_KEY` (local) and `VERCEL_OIDC_TOKEN` (Vercel deployments)

### Client-Side (`utils/streamAI.ts`)
- `streamAICompletion()` - Consumes text streams with chunk-by-chunk callbacks
- `generateAICompletion()` - Non-streaming fallback for compatibility

## Current Implementation

Currently using **non-streaming** for solver and programmer steps to ensure reliability:

```typescript
const solverResult = await generateAICompletion({
    messages: [...],
    aiConfig,
    onError: (error) => { ... }
});
```

## Enabling Streaming

To enable streaming for better UX, replace `generateAICompletion` with `streamAICompletion`:

```typescript
// Import the streaming utility
const { streamAICompletion } = await import("@/app/utils/streamAI");

// Stream the response
const solverResult = await streamAICompletion({
    messages: [
        { role: 'system', content: prompts.system },
        { role: 'user', content: prompts.user }
    ],
    aiConfig,
    onChunk: (chunk) => {
        // Update UI with each chunk as it arrives
        console.log('Received chunk:', chunk);
        // Example: append to a state variable for real-time display
    },
    onComplete: (fullText) => {
        console.log('Stream complete:', fullText);
    },
    onError: (error) => {
        console.error("API error:", error);
        setComponentToRender(<Error message={`API Error: ${error.message}`} />);
    }
});
```

## Benefits of Streaming

- **Better UX**: Users see responses appearing in real-time
- **Perceived Performance**: Feels faster even though total time is similar
- **Early Cancellation**: Can stop generation if needed
- **Token-by-Token Display**: Great for chat interfaces

## When to Use Non-Streaming

- When you need the complete response before processing (e.g., JSON parsing)
- When simplicity is preferred over real-time updates
- For background tasks where UX isn't critical

## Example: Streaming with UI Updates

```typescript
let partialResponse = '';

const result = await streamAICompletion({
    messages: [...],
    aiConfig,
    onChunk: (chunk) => {
        partialResponse += chunk;
        // Update a React state to show partial response
        setPartialSolution(partialResponse);
    },
    onComplete: (fullText) => {
        // Process the complete response
        setFinalSolution(fullText);
    }
});
```

## Implementation Status

- ✅ Server-side streaming support (`/api/ai/chat`)
- ✅ Client-side streaming utility (`streamAICompletion`)
- ✅ Non-streaming fallback (`generateAICompletion`)
- ⏳ UI components use non-streaming (can be upgraded)

To upgrade a component to streaming, simply:
1. Import `streamAICompletion` instead of `generateAICompletion`
2. Add `onChunk` callback to update UI in real-time
3. Test thoroughly to ensure JSON parsing still works with complete response
