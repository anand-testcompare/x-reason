import { NextRequest, NextResponse } from "next/server";
import { aiChatCompletion } from "../actions";
import { AIConfig, OpenAIModel, GeminiModel, getModelForProvider } from "../providers";
import { AILogger } from "../../../utils/aiLogger";

export async function POST(request: NextRequest) {
  const requestId = AILogger.generateRequestId();
  console.log(`🌐 [API-ROUTE] Incoming AI chat request (Request ID: ${requestId})`);
  
  try {
    const { messages, provider = 'gemini', model } = await request.json();
    
    console.log(`🌐 [API-ROUTE] Request details: provider=${provider}, model=${model || 'default'}, messages=${messages?.length || 0} (Request ID: ${requestId})`);
    
    if (!messages || !Array.isArray(messages)) {
      console.log(`🌐 [API-ROUTE] Bad request: Invalid messages array (Request ID: ${requestId})`);
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const validProviders = ['openai', 'gemini'];
    if (!validProviders.includes(provider)) {
      console.log(`🌐 [API-ROUTE] Bad request: Invalid provider ${provider} (Request ID: ${requestId})`);
      return NextResponse.json(
        { error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` },
        { status: 400 }
      );
    }

    const config: AIConfig = { provider, model };
    const response = await aiChatCompletion(messages, config);
    
    if (!response) {
      console.log(`🌐 [API-ROUTE] AI provider returned null response (Request ID: ${requestId})`);
      return NextResponse.json(
        { error: "Failed to get response from AI provider" },
        { status: 500 }
      );
    }
    
    const actualModel = getModelForProvider(provider, model);
    console.log(`🌐 [API-ROUTE] Successful response: ${response.length} chars from ${provider}/${actualModel} (Request ID: ${requestId})`);
    
    return NextResponse.json({ 
      content: response,
      provider,
      model: actualModel,
      requestId
    });
  } catch (error) {
    const duration = Date.now();
    console.error(`🌐 [API-ROUTE] Error processing request (Request ID: ${requestId}):`, error);
    
    return NextResponse.json(
      { 
        error: "Internal server error", 
        message: error instanceof Error ? error.message : "Unknown error",
        requestId 
      },
      { status: 500 }
    );
  }
}