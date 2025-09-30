import { OPENAI_MODELS, DEFAULT_OPENAI_MODEL, OpenAIModel } from '@/app/api/ai/providers';

describe('OpenAI models configuration', () => {
  it('should include all latest OpenAI models', () => {
    const expectedModels: OpenAIModel[] = [
      'openai/gpt-oss-120b', 'openai/gpt-5-nano', 
      'openai/gpt-4o-mini', 'openai/gpt-4.1-nano'
    ];

    expectedModels.forEach(model => {
      expect(OPENAI_MODELS[model]).toBeDefined();
      expect(OPENAI_MODELS[model]).toHaveProperty('name');
      expect(OPENAI_MODELS[model]).toHaveProperty('description');
    });
  });

  it('should have valid default model', () => {
    expect(OPENAI_MODELS).toHaveProperty(DEFAULT_OPENAI_MODEL);
    expect(DEFAULT_OPENAI_MODEL).toBeTruthy();
    expect(DEFAULT_OPENAI_MODEL).toBe('openai/gpt-oss-120b');
  });

  it('should have proper model metadata structure', () => {
    Object.values(OPENAI_MODELS).forEach(model => {
      expect(model).toHaveProperty('name');
      expect(model).toHaveProperty('description');
      expect(typeof model.name).toBe('string');
      expect(typeof model.description).toBe('string');
      expect(model.name.length).toBeGreaterThan(0);
      expect(model.description.length).toBeGreaterThan(0);
    });
  });
});
