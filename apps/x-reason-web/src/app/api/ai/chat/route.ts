import { NextRequest } from "next/server";
import {
  GATEWAY_AUTH_ERROR,
  getAIModel,
  getModelForProvider,
  hasGatewayAuth,
  isGatewayAuthenticationError,
  AIConfig,
  AIMessage,
  DEFAULT_PROVIDER,
} from "../providers";
import { streamText, generateText } from 'ai';
import { AILogger } from "../../../utils/aiLogger";

export async function POST(request: NextRequest) {
  const requestId = AILogger.generateRequestId();
  console.log(`🌐 [API-ROUTE] Incoming AI chat request (Request ID: ${requestId})`);

  try {
    // Parse JSON with better error handling
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.log(`🌐 [API-ROUTE] JSON parsing error (Request ID: ${requestId}):`, jsonError);
      return new Response(
        JSON.stringify({
          error: "Invalid JSON in request body",
          details: jsonError instanceof Error ? jsonError.message : 'Unknown parsing error'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { messages, provider = DEFAULT_PROVIDER, model, stream = true } = body;

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

    if (!hasGatewayAuth(request.headers)) {
      console.log(`🌐 [API-ROUTE] Missing Vercel OIDC auth (Request ID: ${requestId})`);
      return new Response(
        JSON.stringify({ error: GATEWAY_AUTH_ERROR }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const config: AIConfig = { provider, model };
    const aiModel = getAIModel(config);
    const actualModel = getModelForProvider(provider, model);

    // Log the request
    AILogger.logRequest(provider, actualModel, messages, requestId);

    // Convert to CoreMessage format
    const coreMessages = messages.map((msg: AIMessage) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Handle non-streaming requests
    if (!stream) {
      const startTime = Date.now();
      const result = await generateText({
        model: aiModel,
        messages: coreMessages,
      });

      const duration = Date.now() - startTime;
      AILogger.logResponse(provider, actualModel, result.text, duration, requestId);

      return new Response(
        JSON.stringify({ text: result.text }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Use Vercel AI SDK's streamText for streaming requests
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
    if (isGatewayAuthenticationError(error)) {
      return new Response(
        JSON.stringify({ error: GATEWAY_AUTH_ERROR }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
