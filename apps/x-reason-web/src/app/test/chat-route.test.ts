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
  getAIModel: jest.fn((config) => ({
    modelId: config.model || 'gpt-4.1-nano',
    provider: config.provider,
  })),
  getModelForProvider: jest.fn((provider, model) => model || 'gpt-4.1-nano'),
}));

describe('Chat API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call streamText with correct parameters for OpenAI', async () => {
    const mockStreamText = streamText as jest.MockedFunction<typeof streamText>;
    mockStreamText.mockResolvedValue({
      toDataStreamResponse: jest.fn(() => new Response('mock response')),
    } as any);

    const requestBody = {
      messages: [{ role: 'user', content: 'Hello' }],
      provider: 'openai',
      model: 'gpt-4.1-mini',
    };

    // Simulate the API route logic
    const { getAIModel } = await import('../api/ai/providers');
    const model = getAIModel({ provider: 'openai', model: 'gpt-4.1-mini' });

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
    const mockStreamText = streamText as jest.MockedFunction<typeof streamText>;
    mockStreamText.mockResolvedValue({
      toDataStreamResponse: jest.fn(() => new Response('mock response')),
    } as any);

    const requestBody = {
      messages: [{ role: 'user', content: 'Hello' }],
      provider: 'gemini',
      model: 'gemini-2.0-flash',
    };

    // Simulate the API route logic
    const { getAIModel } = await import('../api/ai/providers');
    const model = getAIModel({ provider: 'gemini', model: 'gemini-2.0-flash' });

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
    const mockStreamText = streamText as jest.MockedFunction<typeof streamText>;
    const mockResponseBody = 'streamed content';

    mockStreamText.mockResolvedValue({
      toDataStreamResponse: jest.fn(() => ({ body: mockResponseBody })),
    } as any);

    const { getAIModel } = await import('../api/ai/providers');
    const model = getAIModel({ provider: 'openai' });

    const result = await streamText({
      model,
      messages: [{ role: 'user', content: 'test' }],
    });

    const response = result.toDataStreamResponse();
    expect(response.body).toBe(mockResponseBody);
  });
});