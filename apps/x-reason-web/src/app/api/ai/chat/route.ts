import { NextRequest } from "next/server";
import { getAIModel, getModelForProvider, AIConfig, AIMessage } from "../providers";
import { streamText } from 'ai';
import { AILogger } from "../../../utils/aiLogger";

export async function POST(request: NextRequest) {
  const requestId = AILogger.generateRequestId();
  console.log(`🌐 [API-ROUTE] Incoming AI chat request (Request ID: ${requestId})`);

  try {
    const { messages, provider = 'gemini', model, credentials, stream = true } = await request.json();

    console.log(`🌐 [API-ROUTE] Request details: provider=${provider}, model=${model || 'default'}, messages=${messages?.length || 0}, stream=${stream} (Request ID: ${requestId})`);

    if (!messages || !Array.isArray(messages)) {
      console.log(`🌐 [API-ROUTE] Bad request: Invalid messages array (Request ID: ${requestId})`);
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const validProviders = ['openai', 'gemini'];
    if (!validProviders.includes(provider)) {
      console.log(`🌐 [API-ROUTE] Bad request: Invalid provider ${provider} (Request ID: ${requestId})`);
      return new Response(
        JSON.stringify({ error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const config: AIConfig = { provider, model, credentials };
    const aiModel = getAIModel(config);
    const actualModel = getModelForProvider(provider, model);

    // Log the request
    AILogger.logRequest(provider, actualModel, messages, requestId);

    // Convert to CoreMessage format
    const coreMessages = messages.map((msg: AIMessage) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Use Vercel AI SDK's streamText
    const result = streamText({
      model: aiModel,
      messages: coreMessages,
      onFinish: ({ text }) => {
        AILogger.logResponse(provider, actualModel, text, 0, requestId);
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.log(`🌐 [API-ROUTE] Error processing request (Request ID: ${requestId}):`, error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}