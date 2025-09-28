import { NextRequest } from 'next/server';
import { aiChatCompletion } from "../../ai/actions";
import { AIConfig } from "../../ai/providers";

export async function POST(request: NextRequest) {
  try {
    const { query, provider = 'gemini', credentials } = await request.json();
    
    if (!query) {
      return new Response('Query is required', { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send progress update
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'progress', data: 'Processing your query...' })}\n\n`));

          // Use the AI chat API directly (non-streaming for now)
          const config: AIConfig = { provider, credentials };
          const response = await aiChatCompletion([{ role: 'user', content: query }], config);

          if (!response) {
            throw new Error('Failed to get response from AI provider');
          }

          // Send the response as content
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: response })}\n\n`));
          
          // Send completion marker
          controller.enqueue(encoder.encode('data: {"type": "complete"}\n\n'));
        } catch (error) {
          console.error('Streaming error:', error);
          const errorData = JSON.stringify({ 
            type: 'error', 
            data: error instanceof Error ? error.message : 'Unknown error' 
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}