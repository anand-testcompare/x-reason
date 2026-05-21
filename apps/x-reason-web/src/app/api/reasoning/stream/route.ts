import { NextRequest } from 'next/server';
import {
  GATEWAY_AUTH_ERROR,
  getAIModel,
  hasGatewayAuth,
  isGatewayAuthenticationError,
  AIConfig,
  DEFAULT_PROVIDER,
} from "../../ai/providers";
import { streamText } from 'ai';

export async function POST(request: NextRequest) {
  try {
    const { query, provider = DEFAULT_PROVIDER, model } = await request.json();

    if (!query) {
      return new Response('Query is required', { status: 400 });
    }

    if (!hasGatewayAuth(request.headers)) {
      return new Response(GATEWAY_AUTH_ERROR, {
        status: 401,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const config: AIConfig = { provider, model };
    const aiModel = getAIModel(config);

    // Create a custom SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = streamText({
            model: aiModel,
            messages: [{ role: 'user', content: query }],
          });

          // Send progress message
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'progress', data: 'Starting...' })}\n\n`));

          // Stream the content
          for await (const chunk of result.textStream) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: chunk })}\n\n`));
          }

          // Send completion message
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete' })}\n\n`));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          const data = isGatewayAuthenticationError(error)
            ? GATEWAY_AUTH_ERROR
            : String(error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', data })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API error:', error);
    if (isGatewayAuthenticationError(error)) {
      return new Response(GATEWAY_AUTH_ERROR, {
        status: 401,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    return new Response('Internal server error', { status: 500 });
  }
}
