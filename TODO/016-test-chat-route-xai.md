# Story 016 — Testing: Add Unit Tests for Chat Route XAI Provider Support

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [ ] Done (delete this story file after completion)

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

## Intent

Create comprehensive unit tests for the chat API route's XAI provider support. Verify that the route accepts 'xai' as a valid provider, handles default and explicit model selection, and streams responses correctly.

## Scope and guardrails

- Create or extend test files for chat route functionality
- Test XAI provider validation and acceptance
- Test default model resolution for XAI
- Test explicit model selection for XAI
- Test streaming functionality with XAI
- Use Jest with mocking for Vercel AI SDK streaming
- Keep tests fast and deterministic (no real API calls)

## What to do

1. Create or extend test file: `apps/x-reason-web/src/app/test/chat-route-xai.test.ts`

2. Test XAI provider validation:
   ```typescript
   import { POST } from '@/app/api/ai/chat/route';

   describe('chat route - XAI provider validation', () => {
     beforeEach(() => {
       process.env.AI_GATEWAY_API_KEY = 'test-gateway-key';
     });

     it('should accept xai as valid provider', async () => {
       const request = new Request('http://localhost/api/ai/chat', {
         method: 'POST',
         body: JSON.stringify({
           provider: 'xai',
           messages: [{ role: 'user', content: 'Hello' }]
         })
       });

       const response = await POST(request);
       expect(response.status).not.toBe(400);
     });

     it('should reject invalid providers', async () => {
       const request = new Request('http://localhost/api/ai/chat', {
         method: 'POST',
         body: JSON.stringify({
           provider: 'invalid-provider',
           messages: [{ role: 'user', content: 'Hello' }]
         })
       });

       const response = await POST(request);
       expect(response.status).toBe(400);

       const data = await response.json();
       expect(data.error).toContain('Invalid provider');
       expect(data.error).toContain('xai');
     });
   });
   ```

3. Test default model resolution:
   ```typescript
   describe('chat route - XAI default model', () => {
     beforeEach(() => {
       process.env.AI_GATEWAY_API_KEY = 'test-gateway-key';
     });

     it('should use default XAI model when model not specified', async () => {
       const streamTextMock = jest.fn().mockResolvedValue({
         toDataStreamResponse: jest.fn().mockReturnValue(new Response())
       });

       jest.mock('ai', () => ({
         streamText: streamTextMock
       }));

       const request = new Request('http://localhost/api/ai/chat', {
         method: 'POST',
         body: JSON.stringify({
           provider: 'xai',
           messages: [{ role: 'user', content: 'Hello' }]
         })
       });

       await POST(request);

       expect(streamTextMock).toHaveBeenCalledWith(
         expect.objectContaining({
           model: expect.stringMatching(/grok-beta/)
         })
       );
     });
   });
   ```

4. Test explicit model selection:
   ```typescript
   describe('chat route - XAI explicit model', () => {
     beforeEach(() => {
       process.env.AI_GATEWAY_API_KEY = 'test-gateway-key';
     });

     it('should use specified XAI model', async () => {
       const streamTextMock = jest.fn().mockResolvedValue({
         toDataStreamResponse: jest.fn().mockReturnValue(new Response())
       });

       jest.mock('ai', () => ({
         streamText: streamTextMock
       }));

       const request = new Request('http://localhost/api/ai/chat', {
         method: 'POST',
         body: JSON.stringify({
           provider: 'xai',
           model: 'grok-2-turbo',
           messages: [{ role: 'user', content: 'Hello' }]
         })
       });

       await POST(request);

       expect(streamTextMock).toHaveBeenCalledWith(
         expect.objectContaining({
           model: expect.stringMatching(/grok-2-turbo/)
         })
       );
     });

     it('should reject expensive XAI models', async () => {
       const request = new Request('http://localhost/api/ai/chat', {
         method: 'POST',
         body: JSON.stringify({
           provider: 'xai',
           model: 'grok-4', // Expensive, should be rejected
           messages: [{ role: 'user', content: 'Hello' }]
         })
       });

       const response = await POST(request);
       expect(response.status).toBe(400);

       const data = await response.json();
       expect(data.error).toContain('excluded due to high cost');
     });
   });
   ```

5. Test streaming functionality:
   ```typescript
   describe('chat route - XAI streaming', () => {
     beforeEach(() => {
       process.env.AI_GATEWAY_API_KEY = 'test-gateway-key';
     });

     it('should return streaming response for XAI', async () => {
       const mockStream = new ReadableStream({
         start(controller) {
           controller.enqueue('data: {"text":"Hello"}\n\n');
           controller.close();
         }
       });

       const streamTextMock = jest.fn().mockResolvedValue({
         toDataStreamResponse: jest.fn().mockReturnValue(
           new Response(mockStream)
         )
       });

       jest.mock('ai', () => ({
         streamText: streamTextMock
       }));

       const request = new Request('http://localhost/api/ai/chat', {
         method: 'POST',
         body: JSON.stringify({
           provider: 'xai',
           messages: [{ role: 'user', content: 'Hello' }]
         })
       });

       const response = await POST(request);
       expect(response.headers.get('content-type')).toContain('text/event-stream');
     });
   });
   ```

## Acceptance criteria (what success looks like)

- Comprehensive test coverage for chat route XAI support
- Tests verify 'xai' is accepted as valid provider
- Tests verify invalid providers are rejected with helpful errors
- Tests verify default XAI model (grok-beta) is used when not specified
- Tests verify explicit XAI model selection works
- Tests verify expensive models (grok-4) are rejected
- Tests verify streaming functionality works with XAI
- All tests pass: `pnpm test`
- Tests are fast and deterministic (mocked streaming)
- Tests cover edge cases (missing messages, invalid models)

## Lightweight tests to add (1–2 minimum)

This story IS about adding tests, so the tests are the deliverable. At minimum:
- Test 1: Route accepts 'xai' provider
- Test 2: Route uses default XAI model when not specified

(See "What to do" section for comprehensive test suite)

## Steps to implement

1) Create or extend test file: `apps/x-reason-web/src/app/test/chat-route-xai.test.ts`

2) Set up Jest mocks for Vercel AI SDK's `streamText` function

3) Implement provider validation tests

4) Implement default model resolution tests

5) Implement explicit model selection tests

6) Implement expensive model rejection tests

7) Implement streaming functionality tests

8) Run tests: `pnpm test`

9) Verify 100% pass rate

10) Check test coverage for chat route

## No-regression verification

- Run:
  - `pnpm lint` (should pass)
  - `pnpm test` (all tests including new ones should pass)
  - `pnpm build` (should succeed)
- Manual:
  - Verify existing chat route tests still pass (OpenAI, Gemini)
  - Check that tests don't make real API calls
  - Ensure mocks properly simulate streaming behavior

## Out of scope

- Integration tests with real XAI API
- End-to-end tests with full application stack
- Performance testing or load testing
- Testing other API routes (reasoning, etc.)
- Testing UI components that consume chat route

## Estimate

M (comprehensive test suite for API route functionality)

## Links

- `apps/x-reason-web/src/app/test/chat-route-xai.test.ts` - File to create/extend
- `apps/x-reason-web/src/app/api/ai/chat/route.ts` - Code under test

## Dependencies

- Story 012 (Chat route XAI support) - completed

## Notes for implementer

Use Jest's mocking capabilities to simulate Vercel AI SDK's streaming behavior. The tests should verify the route logic without making real API calls. Pay special attention to testing the expensive model rejection logic (grok-4) as this prevents cost overruns.