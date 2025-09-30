/**
 * Tests for Vercel AI Gateway support in providers.ts
 * Story 003: Gateway support with fallback chains
 * Story 004: Gateway-only enforcement (tests added later)
 */

import { getAIModel, AIConfig } from '../api/ai/providers';

describe('providers.ts - Gateway support (Story 003)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('should use AI_GATEWAY_API_KEY when available', () => {
    process.env.AI_GATEWAY_API_KEY = 'gateway-key';
    process.env.OPENAI_API_KEY = 'openai-key';

    const config: AIConfig = { provider: 'openai', model: 'gpt-4.1-nano' };

    // Should not throw, indicating AI_GATEWAY_API_KEY is prioritized
    expect(() => getAIModel(config)).not.toThrow();
  });

  it('should accept baseURL parameter for Gateway routing', () => {
    process.env.AI_GATEWAY_API_KEY = 'gateway-key';
    process.env.AI_GATEWAY_BASE_URL = 'https://gateway.example.com';

    const config: AIConfig = { provider: 'openai', model: 'gpt-4.1-nano' };

    // Should successfully create provider with baseURL
    expect(() => getAIModel(config)).not.toThrow();
  });
});

describe('providers.ts - Gateway-only enforcement (Story 004)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('should succeed with AI_GATEWAY_API_KEY for OpenAI', () => {
    process.env.AI_GATEWAY_API_KEY = 'gateway-key';
    delete process.env.OPENAI_API_KEY;

    const config: AIConfig = { provider: 'openai', model: 'gpt-4.1-nano' };

    expect(() => getAIModel(config)).not.toThrow();
  });

  it('should succeed with AI_GATEWAY_API_KEY for Gemini', () => {
    process.env.AI_GATEWAY_API_KEY = 'gateway-key';
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    const config: AIConfig = { provider: 'gemini', model: 'gemini-2.0-flash' };

    expect(() => getAIModel(config)).not.toThrow();
  });

  it('should throw error when AI_GATEWAY_API_KEY is missing for OpenAI', () => {
    delete process.env.AI_GATEWAY_API_KEY;
    process.env.OPENAI_API_KEY = 'openai-key'; // Should NOT be used

    const config: AIConfig = { provider: 'openai', model: 'gpt-4.1-nano' };

    expect(() => getAIModel(config)).toThrow('AI_GATEWAY_API_KEY is required');
  });

  it('should throw error when AI_GATEWAY_API_KEY is missing for Gemini', () => {
    delete process.env.AI_GATEWAY_API_KEY;
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'gemini-key'; // Should NOT be used

    const config: AIConfig = { provider: 'gemini', model: 'gemini-2.0-flash' };

    expect(() => getAIModel(config)).toThrow('AI_GATEWAY_API_KEY is required');
  });
});