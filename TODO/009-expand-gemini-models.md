# Story 009 — Models: Expand Google Gemini Model List with Latest Variants

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [ ] Done (delete this story file after completion)

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

## Intent

Update the Google Gemini model list in providers.ts to include the latest available variants (Gemini 2.0 Flash, Gemini 1.5 Pro, Gemini 1.5 Flash, etc.) while maintaining backward compatibility with existing model references.

## Scope and guardrails

- Modify only model lists/types in `apps/x-reason-web/src/app/api/ai/providers.ts`
- Add new models without removing existing ones (backward compatibility)
- Update TypeScript types to include new model names
- Update default model if appropriate (consider cost/performance trade-offs)
- Use official Google AI SDK model naming conventions

## What to do

1. Research current Google Gemini model lineup:
   - gemini-2.0-flash-exp (latest experimental)
   - gemini-1.5-pro (flagship)
   - gemini-1.5-flash (cost-effective)
   - gemini-1.5-flash-8b (ultra-fast, lightweight)
   - gemini-1.0-pro (legacy, maintain compatibility)

2. Update Gemini model type definition:
   ```typescript
   export type GeminiModel =
     | 'gemini-2.0-flash-exp'
     | 'gemini-1.5-pro'
     | 'gemini-1.5-flash'
     | 'gemini-1.5-flash-8b'
     | 'gemini-1.0-pro';
   ```

3. Update model configuration with metadata:
   ```typescript
   export const GEMINI_MODELS = {
     'gemini-2.0-flash-exp': { name: 'Gemini 2.0 Flash (Exp)', description: 'Latest experimental model' },
     'gemini-1.5-pro': { name: 'Gemini 1.5 Pro', description: 'Flagship model, best quality' },
     'gemini-1.5-flash': { name: 'Gemini 1.5 Flash', description: 'Fast and cost-effective' },
     'gemini-1.5-flash-8b': { name: 'Gemini 1.5 Flash 8B', description: 'Ultra-fast, lightweight' },
     'gemini-1.0-pro': { name: 'Gemini 1.0 Pro', description: 'Legacy model' },
   };
   ```

4. Update default model constant:
   ```typescript
   export const DEFAULT_GEMINI_MODEL: GeminiModel = 'gemini-1.5-flash'; // Balanced cost/performance
   ```

5. Ensure model resolution function handles new models correctly

6. Add JSDoc comments documenting model characteristics (speed, context window, use cases)

## Acceptance criteria (what success looks like)

- All current Gemini models included in type definitions (flash, pro, experimental variants)
- Model metadata includes name and description for UI display
- Default model set to a reasonable choice (balance cost/performance)
- Backward compatibility: existing code using old model names continues to work
- Type safety: TypeScript enforces valid model names
- Model resolution function works with new models
- JSDoc comments document model characteristics (speed, context window)

## Lightweight tests to add (1–2 minimum)

- Unit test (Jest): Gemini model configuration
  - Test 1: Verify all models in type definition exist in GEMINI_MODELS config
  - Test 2: Verify default model is a valid Gemini model

Add to: `apps/x-reason-web/src/app/test/providers-models.test.ts` (extend from Story 008)

```typescript
import { GEMINI_MODELS, DEFAULT_GEMINI_MODEL, GeminiModel } from '@/app/api/ai/providers';

describe('Gemini models configuration', () => {
  it('should include all latest Gemini models', () => {
    const expectedModels = [
      'gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash',
      'gemini-1.5-flash-8b', 'gemini-1.0-pro'
    ];

    expectedModels.forEach(model => {
      expect(GEMINI_MODELS).toHaveProperty(model);
      expect(GEMINI_MODELS[model]).toHaveProperty('name');
      expect(GEMINI_MODELS[model]).toHaveProperty('description');
    });
  });

  it('should have valid default model', () => {
    expect(GEMINI_MODELS).toHaveProperty(DEFAULT_GEMINI_MODEL);
    expect(DEFAULT_GEMINI_MODEL).toBeTruthy();
  });
});
```

## Steps to implement

1) Read `apps/x-reason-web/src/app/api/ai/providers.ts` to locate Gemini model definitions

2) Research latest Gemini model lineup from Google AI documentation

3) Update `GeminiModel` type with new model names

4) Create or update `GEMINI_MODELS` configuration object with metadata

5) Update `DEFAULT_GEMINI_MODEL` constant (consider gemini-1.5-flash for balance)

6) Add JSDoc comments documenting model characteristics:
   ```typescript
   /**
    * Google Gemini model configuration
    * - gemini-1.5-pro: Best quality, larger context window, higher cost
    * - gemini-1.5-flash: Balanced speed and quality, recommended default
    * - gemini-1.5-flash-8b: Ultra-fast, lightweight, lower cost
    * - gemini-2.0-flash-exp: Experimental, may have breaking changes
    */
   ```

7) Add 2 unit tests to `apps/x-reason-web/src/app/test/providers-models.test.ts`

8) Run tests: `pnpm test`

## No-regression verification

- Run:
  - `pnpm lint` (should pass)
  - `pnpm test` (all tests including new ones should pass)
  - `pnpm build` (should succeed)
- Manual:
  - `pnpm dev` then test AI functionality with different Gemini models
  - Verify model selector UI shows new Gemini models (if applicable)
  - Test at least one new model (e.g., gemini-1.5-flash) works correctly
  - Verify streaming works with Gemini models

## Out of scope

- Adding model-specific configuration (temperature, safety settings, etc.)
- Implementing model-specific UI controls
- Cost tracking or usage monitoring
- Deprecated model removal (maintain backward compatibility)
- Non-Gemini provider models (Stories 008, 010-011)

## Estimate

S (straightforward model list update with type safety)

## Links

- `apps/x-reason-web/src/app/api/ai/providers.ts` - File to modify
- `apps/x-reason-web/src/app/test/providers-models.test.ts` - Test file (extend)
- Google AI models documentation: https://ai.google.dev/models/gemini

## Dependencies

- Story 003 (Gateway support in providers.ts) - completed
- Story 008 (OpenAI models) - completed (for consistency)

## Notes for implementer

Check Google AI's official documentation for the most current model list. Note that Gemini models may have different context window sizes (1.5 Pro has 2M token context). The 2.0-flash-exp is experimental and may have API changes. Consider gemini-1.5-flash as a good default for cost/performance balance.