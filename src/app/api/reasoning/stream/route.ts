import { NextRequest } from 'next/server';
import engine from '../engine.v1';
import { solver as chemliSolver, programmer as chemliProgrammer } from '../prompts/chemli/reasoning';

export async function POST(request: NextRequest) {
  try {
    const { query, type = 'solve' } = await request.json();
    
    if (!query) {
      return new Response('Query is required', { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (type === 'solve') {
            // Stream solver results
            for await (const chunk of engine.solver.solveStream!(query, chemliSolver)) {
              const data = JSON.stringify(chunk) + '\n';
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          } else if (type === 'program') {
            // Stream programmer results - need function catalog
            const functionCatalog = 'placeholder_catalog'; // You would get this from your actual catalog
            for await (const chunk of engine.programmer.programStream!(query, functionCatalog, chemliProgrammer)) {
              const data = JSON.stringify(chunk) + '\n';
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
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