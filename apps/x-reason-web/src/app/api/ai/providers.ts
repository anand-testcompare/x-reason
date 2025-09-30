import { createGateway, generateText, streamText, CoreMessage } from 'ai';
import { AILogger } from "../../utils/aiLogger";

export type AIProvider = 'openai' | 'gemini' | 'xai';

/**
 * OpenAI model configuration
 * - openai/gpt-oss-120b: Open source 120B parameter model (Primary default)
 * - openai/gpt-4o-mini: Cost-effective GPT-4o variant
 * - openai/gpt-5-nano: Ultra-fast, lightweight model for simple tasks
 * - openai/gpt-4.1-nano: Compact 4.1 model for efficiency
 */
export type OpenAIModel =
  | 'openai/gpt-oss-120b'
  | 'openai/gpt-4o-mini'
  | 'openai/gpt-5-nano'
  | 'openai/gpt-4.1-nano';

/**
 * Google Gemini model configuration
 * - google/gemini-2.0-flash: Latest model, balanced speed and quality
 * - google/gemini-2.5-flash-lite: Ultra-fast, lightweight, lower cost
 * - google/gemini-2.5-flash: Enhanced 2.5 model with improved capabilities
 */
export type GeminiModel =
  | 'google/gemini-2.0-flash'
  | 'google/gemini-2.5-flash-lite'
  | 'google/gemini-2.5-flash';

/**
 * XAI Grok models - Approved fast models only
 */
export type XAIModel =
  | 'xai/grok-4-fast-non-reasoning'
  | 'xai/grok-code-fast-1';

export interface AIMessage extends Record<string, unknown> {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICredentials {
  openaiApiKey?: string;
  geminiApiKey?: string;
}

export interface AIConfig {
  provider: AIProvider;
  model?: OpenAIModel | GeminiModel | XAIModel;
  credentials?: AICredentials;
}

export interface ModelInfo {
  name: string;
  description: string;
  speed?: string;
  costTier?: string;
}

export const OPENAI_MODELS: Record<OpenAIModel, ModelInfo> = {
  'openai/gpt-oss-120b': { 
    name: 'GPT-OSS 120B', 
    description: 'Open source 120B parameter model (Primary default)',
    speed: 'fast',
    costTier: 'medium'
  },
  'openai/gpt-4o-mini': { 
    name: 'GPT-4o Mini', 
    description: 'Cost-effective GPT-4o variant',
    speed: 'fast',
    costTier: 'low'
  },
  'openai/gpt-5-nano': { 
    name: 'GPT-5 Nano', 
    description: 'Ultra-fast, lightweight model for simple tasks',
    speed: 'very-fast',
    costTier: 'low'
  },
  'openai/gpt-4.1-nano': { 
    name: 'GPT-4.1 Nano', 
    description: 'Compact 4.1 model for efficiency',
    speed: 'fast',
    costTier: 'low'
  },
} as const;

export const GEMINI_MODELS: Record<GeminiModel, ModelInfo> = {
  'google/gemini-2.0-flash': { 
    name: 'Gemini 2.0 Flash', 
    description: 'Latest model, balanced speed and quality',
    speed: 'fast',
    costTier: 'low'
  },
  'google/gemini-2.5-flash-lite': { 
    name: 'Gemini 2.5 Flash Lite', 
    description: 'Ultra-fast, lightweight, lower cost',
    speed: 'very-fast',
    costTier: 'low'
  },
  'google/gemini-2.5-flash': { 
    name: 'Gemini 2.5 Flash', 
    description: 'Enhanced 2.5 model with improved capabilities',
    speed: 'fast',
    costTier: 'medium'
  },
} as const;

export const XAI_MODELS: Record<XAIModel, ModelInfo> = {
  'xai/grok-4-fast-non-reasoning': {
    name: 'Grok 4 Fast (Non-Reasoning)',
    description: 'Fast Grok model without reasoning capabilities',
    speed: 'fast',
    costTier: 'low'
  },
  'xai/grok-code-fast-1': {
    name: 'Grok Code Fast 1',
    description: 'Fast code-optimized Grok model',
    speed: 'very-fast',
    costTier: 'low'
  },
} as const;

export const DEFAULT_OPENAI_MODEL: OpenAIModel = 'openai/gpt-oss-120b';
export const DEFAULT_GEMINI_MODEL: GeminiModel = 'google/gemini-2.0-flash';
export const DEFAULT_XAI_MODEL: XAIModel = 'xai/grok-4-fast-non-reasoning';

// Primary default model (GPT OSS 120B)
export const PRIMARY_DEFAULT_MODEL = DEFAULT_OPENAI_MODEL;
export const PRIMARY_DEFAULT_PROVIDER: AIProvider = 'openai';

// Default models for each provider
const DEFAULT_MODELS: Record<AIProvider, OpenAIModel | GeminiModel | XAIModel> = {
  openai: DEFAULT_OPENAI_MODEL,
  gemini: DEFAULT_GEMINI_MODEL,
  xai: DEFAULT_XAI_MODEL,
};

export function getModelForProvider(provider: AIProvider, model?: OpenAIModel | GeminiModel | XAIModel): string {
  // Only use default if no model is explicitly provided
  if (model) {
    return model;
  }
  return DEFAULT_MODELS[provider];
}

/**
 * Initialize AI Gateway instance with proper configuration.
 *
 * The AI Gateway provides unified access to multiple AI providers (OpenAI, Google, XAI, etc.)
 * through authentication via API key or OIDC token.
 *
 * Authentication priority:
 * 1. Explicit apiKey parameter
 * 2. AI_GATEWAY_API_KEY environment variable (local development)
 * 3. VERCEL_OIDC_TOKEN environment variable (Vercel deployments - auto-injected)
 *
 * @param apiKey - Optional API key (defaults to environment variables)
 * @throws Error if no authentication method is available
 */
function getGatewayInstance(apiKey?: string) {
  // Priority: explicit param > AI_GATEWAY_API_KEY > VERCEL_OIDC_TOKEN
  const key = apiKey || process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;

  // Debug logging
  console.log('🔑 [AUTH] Authentication check:', {
    hasExplicitKey: !!apiKey,
    hasGatewayKey: !!process.env.AI_GATEWAY_API_KEY,
    hasOIDCToken: !!process.env.VERCEL_OIDC_TOKEN,
    isVercelEnv: !!process.env.VERCEL,
    finalKeyAvailable: !!key
  });

  if (!key) {
    throw new Error(
      'AI Gateway authentication required. For local development, set AI_GATEWAY_API_KEY in .env.local. ' +
      'For Vercel deployments, VERCEL_OIDC_TOKEN is automatically injected. ' +
      'Get your API key from: https://vercel.com/docs/ai-gateway/getting-started'
    );
  }

  return createGateway({
    apiKey: key,
    // Default baseURL: https://ai-gateway.vercel.sh/v1/ai
    // Override if needed: baseURL: process.env.AI_GATEWAY_BASE_URL
  });
}

/**
 * Get the AI SDK model instance using AI Gateway.
 *
 * The Gateway handles all provider routing automatically based on the model string format.
 * Model strings use "creator/model-name" format (e.g., "openai/gpt-5-mini", "google/gemini-2.0-flash")
 *
 * @param config - AI configuration including provider and model
 * @returns AI SDK model instance ready for generateText/streamText
 */
export function getAIModel(config: AIConfig) {
  const { provider, model } = config;
  
  // Validate provider before proceeding
  if (!['openai', 'gemini', 'xai'].includes(provider)) {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }
  
  const modelName = getModelForProvider(provider, model);

  // Initialize Gateway instance (validates AI_GATEWAY_API_KEY)
  const gatewayInstance = getGatewayInstance();

  // Use Gateway with model string in "creator/model-name" format
  // The Gateway automatically routes to the correct provider
  return gatewayInstance(modelName);
}

/**
 * Get Gateway instance (for compatibility with existing code)
 * @deprecated Use getAIModel directly instead
 */
export function getProvider(_provider: AIProvider, _model?: string) {
  return getGatewayInstance();
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