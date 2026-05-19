import { generateText, streamText, CoreMessage } from 'ai';
import { AILogger } from "../../utils/aiLogger";

export type AIProvider = 'openai' | 'gemini';
export type AIModel = 'openai/gpt-5.4-nano' | 'google/gemini-3.1-flash-lite';

export interface AIMessage extends Record<string, unknown> {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIConfig {
  provider: AIProvider;
  model?: AIModel;
}

export interface ModelInfo {
  provider: AIProvider;
  model: AIModel;
  name: string;
  description: string;
}

export const AI_MODELS: Record<AIModel, ModelInfo> = {
  'openai/gpt-5.4-nano': {
    provider: 'openai',
    model: 'openai/gpt-5.4-nano',
    name: 'GPT-5.4 Nano',
    description: 'Default fast, low-cost model for lightweight reasoning tasks',
  },
  'google/gemini-3.1-flash-lite': {
    provider: 'gemini',
    model: 'google/gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    description: 'Small Gemini comparison model for fast Gateway runs',
  },
} as const;

export const AI_MODEL_OPTIONS = Object.values(AI_MODELS);

export const DEFAULT_MODEL: AIModel = 'openai/gpt-5.4-nano';
export const DEFAULT_PROVIDER: AIProvider = 'openai';

const DEFAULT_MODELS: Record<AIProvider, AIModel> = {
  openai: DEFAULT_MODEL,
  gemini: 'google/gemini-3.1-flash-lite',
};

function assertSupportedModel(model: string): asserts model is AIModel {
  if (!Object.hasOwn(AI_MODELS, model)) {
    throw new Error(`Unsupported AI model: ${model}`);
  }
}

export function getModelForProvider(provider: AIProvider, model?: AIModel): AIModel {
  if (model) {
    assertSupportedModel(model);
    return model;
  }

  return DEFAULT_MODELS[provider];
}

/**
 * Initialize AI Gateway instance with proper configuration.
 *
 * The AI Gateway provides access to the approved model allowlist through
 * Vercel's OIDC token.
 * @throws Error if no authentication method is available
 */
function assertGatewayAuth() {
  if (!process.env.VERCEL_OIDC_TOKEN) {
    throw new Error(
      'Vercel OIDC token required. Run `pnpm dlx vercel@latest env pull apps/x-reason-web/.env.local` to refresh VERCEL_OIDC_TOKEN.'
    );
  }
}

/**
 * Get the AI SDK model instance using AI Gateway.
 *
 * The Gateway handles all provider routing automatically based on the model string format.
 * Model strings use "creator/model-name" format (e.g., "openai/gpt-5.4-nano", "google/gemini-3.1-flash-lite")
 *
 * @param config - AI configuration including provider and model
 * @returns AI SDK model instance ready for generateText/streamText
 */
export function getAIModel(config: AIConfig) {
  const { provider, model } = config;
  
  if (!['openai', 'gemini'].includes(provider)) {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }
  
  const modelName = getModelForProvider(provider, model);

  if (AI_MODELS[modelName].provider !== provider) {
    throw new Error(`Model ${modelName} is not supported for provider ${provider}`);
  }

  assertGatewayAuth();

  return modelName;
}

// Convert AIMessage to CoreMessage format
function toCoreMessages(messages: AIMessage[]): CoreMessage[] {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));
}

/**
 * Check if an error is a rate limit error
 */
function isRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const errorObj = error as { name?: string; statusCode?: number; message?: string };

  return (
    errorObj.name === 'GatewayRateLimitError' ||
    errorObj.name === 'RateLimitExceededError' ||
    errorObj.statusCode === 429 ||
    (errorObj.message?.includes('rate limit') ?? false) ||
    (errorObj.message?.includes('Rate limit') ?? false)
  );
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  maxDelay: number = 10000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Only retry on rate limit errors
      if (!isRateLimitError(error)) {
        throw error;
      }

      // Don't retry after the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Calculate exponential backoff delay
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      console.log(`⏱️  [RETRY] Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
      await sleep(delay);
    }
  }

  throw lastError;
}

export async function aiChatCompletion(
  messages: AIMessage[],
  config: AIConfig = { provider: 'openai' }
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

    // Wrap the generateText call with retry logic
    const { text } = await retryWithBackoff(
      () => generateText({
        model: aiModel,
        messages: coreMessages,
      }),
      3, // max 3 retries
      2000, // initial delay 2s
      15000 // max delay 15s
    );

    const duration = Date.now() - startTime;

    if (text) {
      AILogger.logResponse(provider, modelName, text, duration, requestId);
    }

    return text;
  } catch (error) {
    const _duration = Date.now() - startTime;
    AILogger.logError(provider, modelName, error, requestId);

    // Provide user-friendly error message for rate limiting
    if (isRateLimitError(error)) {
      console.error(`❌ [RATE_LIMIT] ${provider} rate limit exceeded after retries. Consider using a different provider or waiting before retrying.`);
    } else {
      console.error(`AI provider ${provider} error:`, error);
    }

    return null;
  }
}

export async function aiGenerateContent(
  prompt: string,
  config: AIConfig = { provider: 'openai' }
): Promise<string | null> {
  console.log(`📝 [PROVIDER] aiGenerateContent called with provider: ${config.provider}`);

  const messages: AIMessage[] = [
    { role: 'user', content: prompt }
  ];

  return aiChatCompletion(messages, config);
}

// Export streamText for streaming endpoints
export { streamText };
