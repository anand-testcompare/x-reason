import { AIConfig } from "@/app/api/ai/providers";

export interface StreamAIOptions {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  aiConfig: AIConfig;
  onChunk?: (chunk: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Stream AI responses using Vercel AI SDK's text stream protocol
 *
 * This function consumes the text stream from the /api/ai/chat endpoint
 * and calls onChunk for each text delta, then onComplete with the full text.
 */
export async function streamAICompletion(options: StreamAIOptions): Promise<string> {
  const { messages, aiConfig, onChunk, onComplete, onError } = options;

  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        provider: aiConfig.provider,
        model: aiConfig.model,
        stream: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'API request failed');
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    // Read the stream using the Response body's reader
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      // Decode the chunk and append to full text
      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;

      // Call onChunk callback for each delta
      if (onChunk) {
        onChunk(chunk);
      }
    }

    // Call onComplete with the full text
    if (onComplete) {
      onComplete(fullText);
    }

    return fullText;
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    if (onError) {
      onError(err);
    }
    throw err;
  }
}

/**
 * Non-streaming AI completion (fallback for compatibility)
 */
export async function generateAICompletion(options: Omit<StreamAIOptions, 'onChunk'>): Promise<string> {
  const { messages, aiConfig, onComplete, onError } = options;

  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        provider: aiConfig.provider,
        model: aiConfig.model,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'API request failed');
    }

    const data = await response.json();
    const text = data.text;

    if (onComplete) {
      onComplete(text);
    }

    return text;
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    if (onError) {
      onError(err);
    }
    throw err;
  }
}
