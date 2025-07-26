"use server";

import { chatCompletion } from "../openai/chat/OpenAIRequests";
import { geminiChatCompletion } from "../gemini/chat/GeminiRequests";
import { AILogger } from "../../utils/aiLogger";
import { AIMessage, AIConfig, getModelForProvider } from "./providers";

export async function aiChatCompletion(
  messages: AIMessage[],
  config: AIConfig = { provider: 'gemini' }
): Promise<string | null> {
  const { provider, model, credentials } = config;
  const requestId = AILogger.generateRequestId();
  const actualModel = getModelForProvider(provider, model);
  
  console.log(`🤖 [AI-PROVIDER] Starting ${provider} completion with model: ${actualModel} (Request ID: ${requestId})`);
  console.log(`🤖 [AI-PROVIDER] Credentials available: openai=${credentials?.openaiApiKey ? 'YES' : 'NO'}, gemini=${credentials?.geminiApiKey ? 'YES' : 'NO'} (Request ID: ${requestId})`);
  
  try {
    let result: string | null = null;
    
    if (provider === 'openai') {
      console.log(`🤖 [AI-PROVIDER] Calling OpenAI with API key: ${credentials?.openaiApiKey ? 'PROVIDED' : 'NOT PROVIDED'} (Request ID: ${requestId})`);
      result = await chatCompletion({
        messages,
        model: actualModel as any
      }, requestId, credentials?.openaiApiKey);
    } else if (provider === 'gemini') {
      console.log(`🤖 [AI-PROVIDER] Calling Gemini with API key: ${credentials?.geminiApiKey ? 'PROVIDED' : 'NOT PROVIDED'} (Request ID: ${requestId})`);
      result = await geminiChatCompletion(messages, requestId, actualModel, credentials?.geminiApiKey);
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