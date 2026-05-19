jest.mock('ai', () => ({
  generateText: jest.fn(),
  streamText: jest.fn(),
}));

import { getAIModel, getModelForProvider, AIConfig } from '../api/ai/providers';

describe('AI Providers Module', () => {
  describe('getModelForProvider', () => {
    it('should return provider defaults when no model is specified', () => {
      expect(getModelForProvider('openai')).toBe('openai/gpt-5.4-nano');
      expect(getModelForProvider('gemini')).toBe('google/gemini-3.1-flash-lite');
    });

    it('should reject models outside the allowlist', () => {
      expect(() => getModelForProvider('openai', 'openai/gpt-5.5' as never))
        .toThrow('Unsupported AI model: openai/gpt-5.5');
    });
  });

  describe('getAIModel', () => {
    it('should return plain Gateway model ids for the AI SDK', () => {
      const config: AIConfig = {
        provider: 'openai',
        model: 'openai/gpt-5.4-nano',
      };

      expect(getAIModel(config)).toBe('openai/gpt-5.4-nano');
    });

    it('should reject unsupported providers', () => {
      const config: AIConfig = {
        provider: 'xai' as never,
      };

      expect(() => getAIModel(config)).toThrow('Unsupported AI provider: xai');
    });

    it('should reject provider/model mismatches', () => {
      const config: AIConfig = {
        provider: 'gemini',
        model: 'openai/gpt-5.4-nano',
      };

      expect(() => getAIModel(config))
        .toThrow('Model openai/gpt-5.4-nano is not supported for provider gemini');
    });
  });
});
