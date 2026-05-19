import { getAIModel, hasGatewayAuth, AIConfig } from '../api/ai/providers';

describe('providers.ts - Vercel OIDC enforcement', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return plain Gateway model ids for AI SDK routing with OIDC auth', () => {
    delete process.env.AI_GATEWAY_API_KEY;
    process.env.VERCEL_OIDC_TOKEN = 'oidc-token';

    const config: AIConfig = { provider: 'openai', model: 'openai/gpt-5.4-nano' };

    expect(getAIModel(config)).toBe('openai/gpt-5.4-nano');
  });

  it('should remove AI Gateway API keys before SDK routing', () => {
    process.env.AI_GATEWAY_API_KEY = 'gateway-key';
    delete process.env.VERCEL_OIDC_TOKEN;

    const config: AIConfig = { provider: 'openai', model: 'openai/gpt-5.4-nano' };

    expect(getAIModel(config)).toBe('openai/gpt-5.4-nano');
    expect(process.env.AI_GATEWAY_API_KEY).toBeUndefined();
  });

  it('should not treat provider-specific keys as Gateway auth', () => {
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.VERCEL_OIDC_TOKEN;
    process.env.OPENAI_API_KEY = 'openai-key';

    const config: AIConfig = { provider: 'openai', model: 'openai/gpt-5.4-nano' };

    expect(getAIModel(config)).toBe('openai/gpt-5.4-nano');
    expect(hasGatewayAuth()).toBe(false);
  });

  it('should detect Vercel runtime OIDC headers', () => {
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.VERCEL_OIDC_TOKEN;

    const headers = new Headers({ 'x-vercel-oidc-token': 'runtime-token' });

    expect(hasGatewayAuth(headers)).toBe(true);
  });
});
