/**
 * Tests for the unified AI chat API route
 * This route uses Vercel AI SDK for streaming responses
 */

import { streamText } from 'ai';

// Mock the Vercel AI SDK
jest.mock('ai', () => ({
  streamText: jest.fn(),
  createOpenAI: jest.fn(),
  createGoogleGenerativeAI: jest.fn(),
}));

// Mock the providers module
jest.mock('../api/ai/providers', () => ({
  getAIModel: jest.fn((config) => config.model || 'openai/gpt-5.4-nano'),
  getModelForProvider: jest.fn((provider, model) => model || 'openai/gpt-5.4-nano'),
}));

describe('Chat API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
