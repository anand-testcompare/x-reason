# Story 008 — Models: Expand OpenAI Model List with Latest Supported Models

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [ ] Done (delete this story file after completion)

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

## Intent

Update the OpenAI model list in providers.ts to include the latest available models (GPT-4o, GPT-4o-mini, o1-preview, o1-mini, etc.) while maintaining backward compatibility with existing model references.

## Scope and guardrails

- Modify only model lists/types in `apps/x-reason-web/src/app/api/ai/providers.ts`
- Add new models without removing existing ones (backward compatibility)
- Update TypeScript types to include new model names
- Update default model if appropriate (consider cost/performance trade-offs)
- Keep model names consistent with OpenAI's official naming

## What to do

1. Research current OpenAI model lineup:
   - GPT-4o (latest flagship)
   - GPT-4o-mini (cost-effective)
   - GPT-4-turbo (existing)
   - GPT-4 (existing)
   - GPT-3.5-turbo (existing)
   - o1-preview (reasoning model)
   - o1-mini (smaller reasoning model)

2. Update OpenAI model type definition:
   ```typescript
   export type OpenAIModel =
     | 'gpt-4o'
     | 'gpt-4o-mini'
     | 'gpt-4-turbo'
     | 'gpt-4'
     | 'gpt-3.5-turbo'
     | 'o1-preview'
     | 'o1-mini';
   ```

3. Update model configuration with metadata:
   ```typescript
   export const OPENAI_MODELS = {
     'gpt-4o': { name: 'GPT-4o', description: 'Latest flagship model' },
     'gpt-4o-mini': { name: 'GPT-4o Mini', description: 'Cost-effective GPT-4o' },
     'gpt-4-turbo': { name: 'GPT-4 Turbo', description: 'Fast GPT-4' },
     'gpt-4': { name: 'GPT-4', description: 'Original GPT-4' },
     'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', description: 'Fast and affordable' },
     'o1-preview': { name: 'o1 Preview', description: 'Advanced reasoning' },
     'o1-mini': { name: 'o1 Mini', description: 'Efficient reasoning' },
   };
   ```

4. Update default model constant:
   ```typescript
   export const DEFAULT_OPENAI_MODEL: OpenAIModel = 'gpt-4o-mini'; // Balanced cost/performance
   ```

5. Ensure model resolution function handles new models correctly

6. Add JSDoc comments documenting model characteristics (cost tier, use cases)

## Acceptance criteria (what success looks like)

- All current OpenAI models included in type definitions
- Model metadata includes name and description for UI display
- Default model set to a reasonable choice (balance cost/performance)
- Backward compatibility: existing code using old model names continues to work
- Type safety: TypeScript enforces valid model names
- Model resolution function works with new models
- JSDoc comments document model characteristics

## Lightweight tests to add (1–2 minimum)

- Unit test (Jest): OpenAI model configuration
  - Test 1: Verify all models in type definition exist in OPENAI_MODELS config
  - Test 2: Verify default model is a valid OpenAI model

Add to: `apps/x-reason-web/src/app/test/providers-models.test.ts` (new file)

```typescript
import { OPENAI_MODELS, DEFAULT_OPENAI_MODEL, OpenAIModel } from '@/app/api/ai/providers';

describe('OpenAI models configuration', () => {
  it('should include all latest OpenAI models', () => {
    const expectedModels = [
      'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo',
      'gpt-4', 'gpt-3.5-turbo', 'o1-preview', 'o1-mini'
    ];

    expectedModels.forEach(model => {
      expect(OPENAI_MODELS).toHaveProperty(model);
      expect(OPENAI_MODELS[model]).toHaveProperty('name');
      expect(OPENAI_MODELS[model]).toHaveProperty('description');
    });
  });

  it('should have valid default model', () => {
    expect(OPENAI_MODELS).toHaveProperty(DEFAULT_OPENAI_MODEL);
    expect(DEFAULT_OPENAI_MODEL).toBeTruthy();
  });
});
```

## Steps to implement

1) Read `apps/x-reason-web/src/app/api/ai/providers.ts` to locate model definitions

2) Research latest OpenAI model lineup from official docs

3) Update `OpenAIModel` type with new model names

4) Create or update `OPENAI_MODELS` configuration object with metadata

5) Update `DEFAULT_OPENAI_MODEL` constant (consider gpt-4o-mini for balance)

6) Add JSDoc comments documenting model characteristics:
   ```typescript
   /**
    * OpenAI model configuration
    * - gpt-4o: Latest flagship, best quality, higher cost
    * - gpt-4o-mini: Cost-effective, good balance
    * - o1-preview: Advanced reasoning, slower, specialized use
    */
   ```

7) Create test file: `apps/x-reason-web/src/app/test/providers-models.test.ts`

8) Add 2 unit tests as specified

9) Run tests: `pnpm test`

## No-regression verification

- Run:
  - `pnpm lint` (should pass)
  - `pnpm test` (all tests including new ones should pass)
  - `pnpm build` (should succeed)
- Manual:
  - `pnpm dev` then test AI functionality with different models
  - Verify model selector UI shows new models (if applicable)
  - Test at least one new model (e.g., gpt-4o-mini) works correctly

## Out of scope

- Adding model-specific configuration (temperature, max tokens, etc.)
- Implementing model-specific UI controls
- Cost tracking or usage monitoring
- Deprecated model removal (maintain backward compatibility)
- Non-OpenAI provider models (Stories 009, 010-011)

## Estimate

S (straightforward model list update with type safety)

## Links

- `apps/x-reason-web/src/app/api/ai/providers.ts` - File to modify
- `apps/x-reason-web/src/app/test/` - Test directory
- OpenAI models documentation: https://platform.openai.com/docs/models

## Dependencies

- Story 003 (Gateway support in providers.ts) - completed

## Notes for implementer

Check OpenAI's official documentation for the most current model list. Consider cost/performance trade-offs when setting the default model. The o1 models are specialized for reasoning tasks and may have different API parameters (check documentation).