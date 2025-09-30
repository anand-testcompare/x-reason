// Mock the Vercel AI SDK modules before importing
jest.mock('@ai-sdk/openai', () => ({
  createOpenAI: jest.fn(() => jest.fn((modelId: string) => ({
    modelId,
    provider: 'openai',
  }))),
}));

jest.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: jest.fn(() => jest.fn((modelId: string) => ({
    modelId,
    provider: 'google.generative-ai',
  }))),
}));

jest.mock('ai', () => ({
  generateText: jest.fn(),
  streamText: jest.fn(),
}));

import { getModelForProvider, getAIModel, AIConfig } from '../api/ai/providers';

describe('AI Providers Module', () => {
  describe('getModelForProvider', () => {
    it('should return default model for openai when no model specified', () => {
      const model = getModelForProvider('openai');
      expect(model).toBe('gpt-4.1-nano');
    });

    it('should return default model for gemini when no model specified', () => {
      const model = getModelForProvider('gemini');
      expect(model).toBe('gemini-2.0-flash');
    });

    it('should return specified model when provided', () => {
      const model = getModelForProvider('openai', 'gpt-4.1-mini');
      expect(model).toBe('gpt-4.1-mini');
    });
  });

  describe('getAIModel', () => {
    it('should return openai model instance with correct structure', () => {
      const config: AIConfig = {
        provider: 'openai',
        model: 'gpt-4.1-nano',
        credentials: { openaiApiKey: 'test-key' }
      };

      const model = getAIModel(config);

      expect(model).toBeDefined();
      expect(model.modelId).toBe('gpt-4.1-nano');
      expect(model.provider).toBe('openai');
    });

    it('should return gemini model instance with correct structure', () => {
      const config: AIConfig = {
        provider: 'gemini',
        model: 'gemini-2.0-flash',
        credentials: { geminiApiKey: 'test-key' }
      };

      const model = getAIModel(config);

      expect(model).toBeDefined();
      expect(model.modelId).toBe('gemini-2.0-flash');
      expect(model.provider).toBe('google.generative-ai');
    });

    it('should throw error for unsupported provider', () => {
      const config: AIConfig = {
        provider: 'invalid' as 'openai' | 'gemini',
      };

      expect(() => getAIModel(config)).toThrow('Unsupported AI provider: invalid');
    });

    it('should use environment variables when no credentials provided', () => {
      const config: AIConfig = {
        provider: 'openai',
      };

      const model = getAIModel(config);
      expect(model).toBeDefined();
    });
  });
});