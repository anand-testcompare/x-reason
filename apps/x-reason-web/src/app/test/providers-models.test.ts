import { AI_MODELS, AI_MODEL_OPTIONS, DEFAULT_MODEL } from '@/app/api/ai/providers';

describe('AI model allowlist', () => {
  it('should only expose the small approved Gateway models', () => {
    expect(AI_MODEL_OPTIONS.map(model => model.model)).toEqual([
      'openai/gpt-5.4-nano',
      'google/gemini-3.1-flash-lite',
    ]);
  });

  it('should default to the OpenAI fast model', () => {
    expect(DEFAULT_MODEL).toBe('openai/gpt-5.4-nano');
    expect(AI_MODELS[DEFAULT_MODEL]).toBeDefined();
  });
});
