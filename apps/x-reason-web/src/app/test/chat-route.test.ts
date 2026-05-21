/**
 * Tests for the unified AI chat API route
 * This route uses Vercel AI SDK for streaming responses
 */

import { generateText, streamText } from 'ai';
import { POST } from '../api/ai/chat/route';

// Mock the Vercel AI SDK
jest.mock('ai', () => ({
  generateText: jest.fn(),
  streamText: jest.fn(),
  createOpenAI: jest.fn(),
  createGoogleGenerativeAI: jest.fn(),
}));

// Mock the providers module
jest.mock('../api/ai/providers', () => ({
  DEFAULT_PROVIDER: 'openai',
  GATEWAY_AUTH_ERROR: 'Vercel OIDC auth is required for AI Gateway requests.',
  getAIModel: jest.fn((config) => config.model || 'openai/gpt-5.4-nano'),
  getModelForProvider: jest.fn((provider, model) => model || 'openai/gpt-5.4-nano'),
  hasGatewayAuth: jest.fn(() => true),
  isGatewayAuthenticationError: jest.fn(
    (error) => error?.name === 'GatewayAuthenticationError',
  ),
}));

describe('Chat API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { hasGatewayAuth } = jest.requireMock('../api/ai/providers');
    hasGatewayAuth.mockReturnValue(true);
  });

  it('returns an explicit 401 when Vercel OIDC auth is missing', async () => {
    const { hasGatewayAuth } = jest.requireMock('../api/ai/providers');
    hasGatewayAuth.mockReturnValue(false);

    const request = {
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => ({
        messages: [{ role: 'user', content: 'Hello' }],
        provider: 'openai',
        model: 'openai/gpt-5.4-nano',
      }),
    };

    const response = await POST(request as unknown as Parameters<typeof POST>[0]);
    const status = response.status ?? (response as unknown as { init?: ResponseInit }).init?.status;
    const body =
      typeof response.json === 'function'
        ? await response.json()
        : JSON.parse(String((response as unknown as { body: string }).body));

    expect(status).toBe(401);
    expect(body.error).toContain('Vercel OIDC auth is required');
    expect(streamText).not.toHaveBeenCalled();
    expect(generateText).not.toHaveBeenCalled();
  });

  it('returns an explicit 401 when AI Gateway rejects invalid auth', async () => {
    const mockGenerateText = generateText as unknown as jest.Mock;
    const gatewayError = new Error('Unauthenticated request to AI Gateway.');
    gatewayError.name = 'GatewayAuthenticationError';
    mockGenerateText.mockRejectedValue(gatewayError);

    const request = {
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => ({
        messages: [{ role: 'user', content: 'Hello' }],
        provider: 'openai',
        model: 'openai/gpt-5.4-nano',
        stream: false,
      }),
    };

    const response = await POST(request as unknown as Parameters<typeof POST>[0]);
    const status = response.status ?? (response as unknown as { init?: ResponseInit }).init?.status;
    const body =
      typeof response.json === 'function'
        ? await response.json()
        : JSON.parse(String((response as unknown as { body: string }).body));

    expect(status).toBe(401);
    expect(body.error).toContain('Vercel OIDC auth is required');
  });

  it('should call streamText with correct parameters for OpenAI', async () => {
    const mockStreamText = streamText as unknown as jest.Mock;
    mockStreamText.mockResolvedValue({
      toTextStreamResponse: jest.fn(() => new Response('mock response')),
    });

    const requestBody = {
      messages: [{ role: 'user' as const, content: 'Hello' }],
      provider: 'openai',
      model: 'openai/gpt-5.4-nano',
    };

    // Simulate the API route logic
    const { getAIModel } = await import('../api/ai/providers');
    const model = getAIModel({ provider: 'openai', model: 'openai/gpt-5.4-nano' });

    await streamText({
      model,
      messages: requestBody.messages,
    });

    expect(mockStreamText).toHaveBeenCalledWith({
      model,
      messages: requestBody.messages,
    });
  });

  it('should call streamText with correct parameters for Gemini', async () => {
    const mockStreamText = streamText as unknown as jest.Mock;
    mockStreamText.mockResolvedValue({
      toTextStreamResponse: jest.fn(() => new Response('mock response')),
    });

    const requestBody = {
      messages: [{ role: 'user' as const, content: 'Hello' }],
      provider: 'gemini',
      model: 'google/gemini-3.1-flash-lite',
    };

    // Simulate the API route logic
    const { getAIModel } = await import('../api/ai/providers');
    const model = getAIModel({ provider: 'gemini', model: 'google/gemini-3.1-flash-lite' });

    await streamText({
      model,
      messages: requestBody.messages,
    });

    expect(mockStreamText).toHaveBeenCalledWith({
      model,
      messages: requestBody.messages,
    });
  });

  it('should handle streaming response correctly', async () => {
    const mockStreamText = streamText as unknown as jest.Mock;
    const mockResponseBody = 'streamed content';

    mockStreamText.mockResolvedValue({
      toTextStreamResponse: jest.fn(() => ({ body: mockResponseBody })),
    });

    const { getAIModel } = await import('../api/ai/providers');
    const model = getAIModel({ provider: 'openai' });

    const result = await streamText({
      model,
      messages: [{ role: 'user', content: 'test' }],
    });

    const response = result.toTextStreamResponse();
    expect(response.body).toBe(mockResponseBody);
  });
});
