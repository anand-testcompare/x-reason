import { NextRequest } from 'next/server';
import { getAIModel, AIConfig } from "../../ai/providers";
import { streamText } from 'ai';

export async function POST(request: NextRequest) {
  try {
    const { query, provider = 'gemini', credentials } = await request.json();

    if (!query) {
      return new Response('Query is required', { status: 400 });
    }

    const config: AIConfig = { provider, credentials };
    const aiModel = getAIModel(config);

    const result = streamText({
      model: aiModel,
      messages: [{ role: 'user', content: query }],
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}