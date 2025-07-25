"use server";

import { chatCompletion } from "../openai/chat/OpenAIRequests";
import { geminiChatCompletion } from "../gemini/chat/GeminiRequests";
import { AILogger } from "../../utils/aiLogger";
import { AIMessage, AIConfig, getModelForProvider } from "./providers";

export async function aiChatCompletion(
  messages: AIMessage[],
  config: AIConfig = { provider: 'gemini' }
): Promise<string | null> {
  const { provider, model } = config;
  const requestId = AILogger.generateRequestId();
  const actualModel = getModelForProvider(provider, model);
  
  console.log(`🤖 [AI-PROVIDER] Starting ${provider} completion with model: ${actualModel} (Request ID: ${requestId})`);
  
  try {
    let result: string | null = null;
    
    if (provider === 'openai') {
      result = await chatCompletion({
        messages,
        model: actualModel as any
      }, requestId);
    } else if (provider === 'gemini') {
      result = await geminiChatCompletion(messages, requestId, actualModel);
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    
    console.log(`🤖 [AI-PROVIDER] ${provider} completion successful: ${result?.length || 0} chars (Request ID: ${requestId})`);
    return result;
  } catch (error) {
    console.error(`🤖 [AI-PROVIDER] ${provider} completion failed (Request ID: ${requestId}):`, error);
    throw error;
  }
}

export async function aiGenerateContent(
  prompt: string,
  config: AIConfig = { provider: 'gemini' }
): Promise<string | null> {
  const requestId = AILogger.generateRequestId();
  console.log(`🤖 [AI-PROVIDER] Starting content generation with ${config.provider} (Request ID: ${requestId})`);
  
  const messages: AIMessage[] = [
    { role: 'user', content: prompt }
  ];
  
  return await aiChatCompletion(messages, config);
}