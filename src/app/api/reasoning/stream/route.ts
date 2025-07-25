import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query, provider = 'gemini' } = await request.json();
    
    if (!query) {
      return new Response('Query is required', { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Use the AI chat API for streaming instead of the hardcoded engine
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [{ role: 'user', content: query }],
              provider: provider,
              stream: true
            })
          });

          if (!response.ok) {
            throw new Error(`AI API error: ${response.status}`);
          }

          // Stream the AI response
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          
          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value);
              // Stream each chunk as content
              if (chunk.trim()) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: chunk })}\n\n`));
              }
            }
          } else {
            // Fallback to non-streaming response
            const result = await response.text();
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: result })}\n\n`));
          }
          
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
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}