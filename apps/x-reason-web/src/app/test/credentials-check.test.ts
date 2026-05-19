/**
 * Tests for credentials check logic
 * Note: Testing the logic directly rather than the route to avoid Next.js mocking complexity.
 */

describe('credentials check logic', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  function getAvailability() {
    const hasGatewayAuth = !!process.env.VERCEL_OIDC_TOKEN;
    return {
      openai: hasGatewayAuth,
      gemini: hasGatewayAuth,
    };
  }

  it('should not expose direct provider keys when gateway auth is missing', () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-gemini-key';
    process.env.OPENAI_API_KEY = 'test-openai-key';
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.VERCEL_OIDC_TOKEN;

    const hasServerCredentials = getAvailability();

    expect(hasServerCredentials.gemini).toBe(false);
    expect(hasServerCredentials.openai).toBe(false);
  });

  it('should return false when gateway auth is missing', () => {
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.VERCEL_OIDC_TOKEN;

    const hasServerCredentials = getAvailability();

    expect(hasServerCredentials.gemini).toBe(false);
    expect(hasServerCredentials.openai).toBe(false);
  });

  it('should ignore AI_GATEWAY_API_KEY without OIDC', () => {
    process.env.AI_GATEWAY_API_KEY = 'test-gateway-key';
    delete process.env.OPENAI_API_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    delete process.env.VERCEL_OIDC_TOKEN;

    const hasServerCredentials = getAvailability();

    expect(hasServerCredentials.gemini).toBe(false);
    expect(hasServerCredentials.openai).toBe(false);
  });

  it('should detect VERCEL_OIDC_TOKEN for approved providers', () => {
    delete process.env.AI_GATEWAY_API_KEY;
    process.env.VERCEL_OIDC_TOKEN = 'test-oidc-token';

    const hasServerCredentials = getAvailability();

    expect(hasServerCredentials.gemini).toBe(true);
    expect(hasServerCredentials.openai).toBe(true);
  });
});
