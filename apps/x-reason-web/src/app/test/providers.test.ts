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

import { getModelForProvider, getAIModel, AIConfig, GEMINI_MODELS, DEFAULT_GEMINI_MODEL, GeminiModel } from '../api/ai/providers';

describe('AI Providers Module', () => {
  describe('getModelForProvider', () => {
    it('should return default model for openai when no model specified', () => {
      const model = getModelForProvider('openai');
      expect(model).toBe('openai/gpt-5-mini');
    });

    it('should return default model for gemini when no model specified', () => {
      const model = getModelForProvider('gemini');
      expect(model).toBe('google/gemini-2.0-flash');
    });

    it('should return specified model when provided', () => {
      const model = getModelForProvider('openai', 'openai/gpt-4.1-nano');
      expect(model).toBe('openai/gpt-4.1-nano');
    });
  });

  describe('getAIModel', () => {
    it('should return openai model instance with correct structure', () => {
      const config: AIConfig = {
        provider: 'openai',
        model: 'openai/gpt-4.1-nano',
        credentials: { openaiApiKey: 'test-key' }
      };

      const model = getAIModel(config);

      expect(model).toBeDefined();
      expect(model.modelId).toBe('openai/gpt-4.1-nano');
      expect(model.provider).toBe('openai');
    });

    it('should return gemini model instance with correct structure', () => {
      const config: AIConfig = {
        provider: 'gemini',
        model: 'google/gemini-2.0-flash',
        credentials: { geminiApiKey: 'test-key' }
      };

      const model = getAIModel(config);

      expect(model).toBeDefined();
      expect(model.modelId).toBe('google/gemini-2.0-flash');
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

  describe('Gemini models configuration', () => {
    it('should include all latest Gemini models', () => {
      const expectedModels = [
        'google/gemini-2.0-flash',
        'google/gemini-2.5-flash-lite',
        'google/gemini-2.5-flash'
      ];

      expectedModels.forEach(model => {
        expect(GEMINI_MODELS[model as GeminiModel]).toBeDefined();
        expect(GEMINI_MODELS[model as GeminiModel]).toHaveProperty('name');
        expect(GEMINI_MODELS[model as GeminiModel]).toHaveProperty('description');
      });
    });

    it('should have valid default model', () => {
      expect(GEMINI_MODELS[DEFAULT_GEMINI_MODEL]).toBeDefined();
      expect(DEFAULT_GEMINI_MODEL).toBe('google/gemini-2.0-flash');
    });

    it('should have proper model metadata', () => {
      const model = GEMINI_MODELS['google/gemini-2.0-flash'];
      expect(model.name).toBe('Gemini 2.0 Flash');
      expect(model.description).toBe('Latest model, balanced speed and quality');
    });
  });
});