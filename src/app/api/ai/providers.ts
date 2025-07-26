import { chatCompletion } from "../openai/chat/OpenAIRequests";
import { geminiChatCompletion } from "../gemini/chat/GeminiRequests";
import { AILogger } from "../../utils/aiLogger";

export type AIProvider = 'openai' | 'gemini';

export type OpenAIModel = 'o4-mini' | 'o3-mini' | 'gpt-4.1-mini' | 'gpt-4.1-nano';
export type GeminiModel = 'gemini-2.0-flash' | 'gemini-2.5-flash' | 'gemini-2.5-flash-lite' | 'gemini-2.5-pro';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICredentials {
  openaiApiKey?: string;
  geminiApiKey?: string;
}

export interface AIConfig {
  provider: AIProvider;
  model?: OpenAIModel | GeminiModel;
  credentials?: AICredentials;
}

// Default models for each provider
const DEFAULT_MODELS: Record<AIProvider, OpenAIModel | GeminiModel> = {
  openai: 'gpt-4.1-nano',
  gemini: 'gemini-2.0-flash'
};

export function getModelForProvider(provider: AIProvider, model?: OpenAIModel | GeminiModel): string {
  // Only use default if no model is explicitly provided
  if (model) {
    return model;
  }
  return DEFAULT_MODELS[provider];
}

export async function aiChatCompletion(
  messages: AIMessage[],
  config: AIConfig = { provider: 'gemini' }
): Promise<string | null> {
  const { provider, model, credentials } = config;
  const requestId = AILogger.generateRequestId();
  const startTime = Date.now();
  
  console.log(`🔧 [AI_PROVIDER] Config received:`, { provider, model, hasCredentials: !!credentials });
  
  // Get the actual model name to use
  const modelName = getModelForProvider(provider, model);
  
  console.log(`🔧 [AI_PROVIDER] Using model:`, modelName);
  
  // Log the request
  AILogger.logRequest(provider, modelName, messages, requestId);
  
  try {
    let result: string | null = null;
    
    switch (provider) {
      case 'openai':
        result = await chatCompletion({
          messages: messages as any,
          model: modelName as OpenAIModel
        }, requestId, credentials?.openaiApiKey);
        break;
      
      case 'gemini':
        result = await geminiChatCompletion(messages, requestId, modelName as GeminiModel, credentials?.geminiApiKey);
        break;
      
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
    
    const duration = Date.now() - startTime;
    
    if (result) {
      AILogger.logResponse(provider, modelName, result, duration, requestId);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    AILogger.logError(provider, modelName, error, requestId);
    console.error(`AI provider ${provider} error:`, error);
    return null;
  }
}

export async function aiGenerateContent(
  prompt: string,
  config: AIConfig = { provider: 'gemini' }
): Promise<string | null> {
  console.log(`📝 [PROVIDER] aiGenerateContent called with provider: ${config.provider}`);
  
  const messages: AIMessage[] = [
    { role: 'user', content: prompt }
  ];
  
  return aiChatCompletion(messages, config);
}