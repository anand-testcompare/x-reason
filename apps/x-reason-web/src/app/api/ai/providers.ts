import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, streamText, CoreMessage } from 'ai';
import { AILogger } from "../../utils/aiLogger";

export type AIProvider = 'openai' | 'gemini';

export type OpenAIModel = 'o4-mini' | 'o3-mini' | 'gpt-4.1-mini' | 'gpt-4.1-nano' | 'gpt-4o-mini';
export type GeminiModel = 'gemini-2.0-flash' | 'gemini-2.5-flash' | 'gemini-2.5-flash-lite' | 'gemini-2.5-pro' | 'gemini-2.0-flash-exp';

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

// Initialize providers with server-side credentials
function getOpenAIProvider(apiKey?: string) {
  return createOpenAI({
    apiKey: apiKey || process.env.OPENAI_API_KEY || '',
  });
}

function getGoogleProvider(apiKey?: string) {
  return createGoogleGenerativeAI({
    apiKey: apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
  });
}

// Get the AI SDK model instance
export function getAIModel(config: AIConfig) {
  const { provider, model, credentials } = config;
  const modelName = getModelForProvider(provider, model);

  switch (provider) {
    case 'openai': {
      const openai = getOpenAIProvider(credentials?.openaiApiKey);
      return openai(modelName);
    }
    case 'gemini': {
      const google = getGoogleProvider(credentials?.geminiApiKey);
      return google(modelName);
    }
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

// Convert AIMessage to CoreMessage format
function toCoreMessages(messages: AIMessage[]): CoreMessage[] {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));
}

export async function aiChatCompletion(
  messages: AIMessage[],
  config: AIConfig = { provider: 'gemini' }
): Promise<string | null> {
  const { provider, model } = config;
  const requestId = AILogger.generateRequestId();
  const startTime = Date.now();

  console.log(`🔧 [AI_PROVIDER] Config received:`, { provider, model });

  // Get the actual model name to use
  const modelName = getModelForProvider(provider, model);

  console.log(`🔧 [AI_PROVIDER] Using model:`, modelName);

  // Log the request
  AILogger.logRequest(provider, modelName, messages, requestId);

  try {
    const aiModel = getAIModel(config);
    const coreMessages = toCoreMessages(messages);

    const { text } = await generateText({
      model: aiModel,
      messages: coreMessages,
    });

    const duration = Date.now() - startTime;

    if (text) {
      AILogger.logResponse(provider, modelName, text, duration, requestId);
    }

    return text;
  } catch (error) {
    const _duration = Date.now() - startTime;
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

// Export streamText for streaming endpoints
export { streamText };