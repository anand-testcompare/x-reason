# Story 003 — Chat API: Migrate to Vercel AI SDK Streaming Primitives

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [x] Done (delete this story file after completion)

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

Intent
Refactor the chat API route to use Vercel AI SDK streaming helpers instead of direct provider clients. This standardizes streaming response handling and simplifies the implementation while maintaining backward compatibility with existing UI consumers.

Scope and guardrails
- Modify only `apps/x-reason-web/src/app/api/ai/chat/route.ts`
- Use Vercel AI SDK's `streamText` or similar streaming primitives
- Import models from the centralized providers module
- Maintain existing request/response shape for UI compatibility
- No changes to client-side chat components

What to do
- Import `streamText` from `ai` package
- Import model instances from `apps/x-reason-web/src/app/api/ai/providers.ts`
- Replace direct provider streaming logic with `streamText` calls
- Update request parsing to match Vercel AI SDK message format
- Use `.toTextStreamResponse()` or similar to return streaming response
- Preserve existing error handling patterns
- Remove any direct OpenAI/Gemini SDK client instantiation

Acceptance criteria (what success looks like)
- Chat route uses `streamText` from Vercel AI SDK
- No direct provider SDK imports remain in the file
- Streaming responses work identically to previous implementation
- Request/response contract matches existing UI expectations
- Error handling maintains current behavior
- TypeScript compiles without errors

Lightweight tests to add (1–2 minimum)
- Unit (Jest):
  - Test 1: Mock request with messages, verify streamText is called with correct model and messages
  - Test 2: Verify response headers include appropriate streaming content-type

Steps to implement
1) Open `apps/x-reason-web/src/app/api/ai/chat/route.ts`
2) Replace provider SDK imports with Vercel AI SDK imports
3) Import models from centralized providers module
4) Refactor POST handler to use `streamText` primitive
5) Update message format conversion if needed
6) Test streaming response with existing UI
7) Add unit tests for route handler
8) Verify `pnpm test` passes
9) Commit

No-regression verification
- Run:
  - `pnpm lint && pnpm test && pnpm build`
- Manual:
  - `pnpm dev` then test chat functionality at `http://localhost:3000`

Out of scope
- Changes to client-side chat components
- Migration of other API routes (reasoning, openai, gemini)
- UI/UX changes to chat interface

Estimate
M

Links
- `/Users/anandpant/Development/x-reason/apps/x-reason-web/src/app/api/ai/chat/route.ts`
- `/Users/anandpant/Development/x-reason/apps/x-reason-web/src/app/api/ai/providers.ts`