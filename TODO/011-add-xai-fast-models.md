# Story 011 — Models: Add Fast Grok Variants to XAI Provider (Exclude Grok-4)

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [ ] Done (delete this story file after completion)

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

## Intent

Expand the XAI provider model list to include only fast, cost-effective Grok variants. Explicitly exclude the expensive Grok-4 model to prevent accidental high-cost API usage.

## Scope and guardrails

- Modify only XAI model definitions in `apps/x-reason-web/src/app/api/ai/providers.ts`
- Add ONLY fast Grok models (e.g., Grok fast, Grok code fast)
- Explicitly EXCLUDE Grok-4 (expensive flagship model)
- Update TypeScript types to enforce fast-only model selection
- Add comments warning about excluded expensive models
- Maintain consistency with OpenAI/Gemini model configuration patterns

## What to do

1. Research XAI's current fast Grok model lineup:
   - grok-beta (fast general-purpose)
   - grok-vision-beta (fast vision model)
   - grok-2-turbo (faster variant, if available)
   - grok-code-fast (code-optimized, if available)
   - **EXCLUDE**: grok-4, grok-2-1212 (flagship, expensive)

2. Update XAI model type definition with fast-only variants:
   ```typescript
   /**
    * XAI Grok models - FAST VARIANTS ONLY
    *
    * EXCLUDED (expensive):
    * - grok-4: Flagship model, significantly higher cost
    * - grok-2-1212: Premium model, higher cost
    *
    * Use fast variants for cost-effective API usage.
    */
   export type XAIModel =
     | 'grok-beta'
     | 'grok-vision-beta'
     | 'grok-2-turbo'; // Add other fast variants as available
   ```

3. Update XAI model configuration with metadata:
   ```typescript
   export const XAI_MODELS = {
     'grok-beta': {
       name: 'Grok Beta',
       description: 'Fast general-purpose model',
       speed: 'fast',
       costTier: 'low'
     },
     'grok-vision-beta': {
       name: 'Grok Vision Beta',
       description: 'Fast vision capabilities',
       speed: 'fast',
       costTier: 'low'
     },
     'grok-2-turbo': {
       name: 'Grok 2 Turbo',
       description: 'Optimized for speed',
       speed: 'very-fast',
       costTier: 'low'
     },
   };
   ```

4. Update default XAI model to a fast variant:
   ```typescript
   export const DEFAULT_XAI_MODEL: XAIModel = 'grok-beta'; // Fast and reliable
   ```

5. Add runtime validation to reject expensive models if passed:
   ```typescript
   export function validateXAIModel(model: string): XAIModel {
     const EXCLUDED_EXPENSIVE_MODELS = ['grok-4', 'grok-2-1212'];

     if (EXCLUDED_EXPENSIVE_MODELS.includes(model)) {
       throw new Error(
         `Model "${model}" is excluded due to high cost. ` +
         `Use fast variants: ${Object.keys(XAI_MODELS).join(', ')}`
       );
     }

     if (!Object.keys(XAI_MODELS).includes(model)) {
       throw new Error(`Unknown XAI model: ${model}`);
     }

     return model as XAIModel;
   }
   ```

6. Add JSDoc comments documenting the fast-only policy

## Acceptance criteria (what success looks like)

- XAI model list includes ONLY fast, cost-effective Grok variants
- Grok-4 and other expensive models explicitly EXCLUDED from type definition
- Model configuration includes speed and cost tier metadata
- Runtime validation function rejects expensive models with clear error
- Default XAI model is a fast variant
- JSDoc comments clearly document the fast-only policy and excluded models
- Error messages guide users to approved fast models
- Type safety prevents expensive model selection at compile time

## Lightweight tests to add (1–2 minimum)

- Unit test (Jest): XAI fast-only model enforcement
  - Test 1: Verify all models in XAI_MODELS are marked as fast/low-cost
  - Test 2: Verify validation function rejects expensive models (grok-4, grok-2-1212)

Add to: `apps/x-reason-web/src/app/test/providers-xai.test.ts` (extend from Story 010)

```typescript
describe('XAI fast-only models', () => {
  it('should only include fast/low-cost models', () => {
    Object.values(XAI_MODELS).forEach(model => {
      expect(model.speed).toMatch(/fast|very-fast/);
      expect(model.costTier).toBe('low');
    });
  });

  it('should reject expensive models', () => {
    expect(() => validateXAIModel('grok-4')).toThrow('excluded due to high cost');
    expect(() => validateXAIModel('grok-2-1212')).toThrow('excluded due to high cost');
  });

  it('should accept fast models', () => {
    expect(() => validateXAIModel('grok-beta')).not.toThrow();
    expect(() => validateXAIModel('grok-2-turbo')).not.toThrow();
  });
});
```

## Steps to implement

1) Read `apps/x-reason-web/src/app/api/ai/providers.ts` to locate XAI model definitions (from Story 010)

2) Research XAI's current model lineup from official documentation

3) Identify fast variants and expensive models to exclude

4) Update `XAIModel` type with fast-only variants

5) Add comprehensive JSDoc comment documenting excluded models

6) Update `XAI_MODELS` configuration with speed and cost metadata

7) Implement `validateXAIModel()` function with runtime exclusion check

8) Update `DEFAULT_XAI_MODEL` to a fast variant

9) Add unit tests to `apps/x-reason-web/src/app/test/providers-xai.test.ts`

10) Run tests: `pnpm test`

## No-regression verification

- Run:
  - `pnpm lint` (should pass)
  - `pnpm test` (all tests including new validation tests should pass)
  - `pnpm build` (should succeed)
- Manual:
  - Verify TypeScript prevents using 'grok-4' at compile time
  - Test runtime validation rejects expensive models
  - Confirm existing providers (OpenAI, Gemini) unaffected

## Out of scope

- Adding expensive Grok models (explicitly excluded)
- Cost tracking or usage monitoring
- Model-specific parameter tuning
- Updating chat route (Story 012)
- Updating UI provider selector (Story 013)

## Estimate

S (model list expansion with validation)

## Links

- `apps/x-reason-web/src/app/api/ai/providers.ts` - File to modify
- `apps/x-reason-web/src/app/test/providers-xai.test.ts` - Test file
- XAI models documentation: https://docs.x.ai/models

## Dependencies

- Story 010 (Add XAI provider) - completed

## Notes for implementer

Check XAI's official documentation for current fast model names. The model lineup may evolve; prioritize "turbo", "fast", or "beta" variants over flagship models. The validation function provides runtime safety even if someone bypasses TypeScript (e.g., via string manipulation). Be explicit in comments about why expensive models are excluded.