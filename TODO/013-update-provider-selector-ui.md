# Story 013 — UI: Add XAI and Fast Models to AI Provider Selector Component

Status
- [ ] Not started
- [ ] In progress
- [ ] Blocked
- [ ] Ready for review
- [ ] Done (delete this story file after completion)

Agent note: Update this Status section as you work. When the story is fully completed and merged, you may delete this file.

## Intent

Update the AI provider selector UI component to include XAI as a provider option with its fast Grok model variants. Enable users to select XAI and choose from available fast models in the UI.

## Scope and guardrails

- Modify only `apps/x-reason-web/src/app/components/ui/ai-provider-selector.tsx`
- Add 'xai' to provider options
- Display fast Grok models when XAI is selected
- Maintain existing UI/UX patterns for OpenAI and Gemini
- Use shadcn/ui components and theme variables (no hardcoded colors)
- Keep component accessible (ARIA labels, keyboard navigation)

## What to do

1. Read `apps/x-reason-web/src/app/components/ui/ai-provider-selector.tsx` to understand current structure

2. Add XAI to provider list:
   ```typescript
   const providers = [
     { id: 'openai', name: 'OpenAI', icon: OpenAIIcon },
     { id: 'google', name: 'Google Gemini', icon: GoogleIcon },
     { id: 'xai', name: 'X.AI (Grok)', icon: XAIIcon }, // Add XAI
   ];
   ```

3. Import XAI models from providers.ts:
   ```typescript
   import { XAI_MODELS, DEFAULT_XAI_MODEL } from '@/app/api/ai/providers';
   ```

4. Update model list rendering to include XAI models:
   ```typescript
   const getModelsForProvider = (providerId: string) => {
     switch (providerId) {
       case 'openai': return OPENAI_MODELS;
       case 'google': return GEMINI_MODELS;
       case 'xai': return XAI_MODELS;
       default: return {};
     }
   };
   ```

5. Add XAI icon (use X logo or Grok branding):
   ```typescript
   function XAIIcon() {
     return (
       <svg>...</svg> // X.AI logo or simple "X" icon
     );
   }
   ```

6. Update model selection logic to use default XAI model:
   ```typescript
   const defaultModel = provider === 'xai' ? DEFAULT_XAI_MODEL
     : provider === 'openai' ? DEFAULT_OPENAI_MODEL
     : DEFAULT_GEMINI_MODEL;
   ```

7. Add hover state and visual feedback for XAI option

8. Ensure model descriptions display correctly for XAI models (from XAI_MODELS config)

9. Update ARIA labels to include XAI:
   ```typescript
   aria-label="Select AI provider: OpenAI, Google Gemini, or X.AI"
   ```

## Acceptance criteria (what success looks like)

- XAI appears as a provider option in the selector UI
- XAI icon displays correctly (X logo or Grok branding)
- Selecting XAI shows list of fast Grok models
- Model descriptions display from XAI_MODELS configuration
- Default XAI model (grok-beta) is pre-selected when XAI chosen
- UI follows existing shadcn/ui theming (no hardcoded colors)
- Component remains accessible (keyboard navigation, ARIA labels)
- Existing OpenAI and Gemini selections unaffected
- Responsive design works on mobile and desktop

## Lightweight tests to add (1–2 minimum)

- Unit test (Jest + Testing Library): Provider selector XAI support
  - Test 1: Verify XAI option is rendered in provider list
  - Test 2: Verify selecting XAI displays fast Grok models

Add to: `apps/x-reason-web/src/app/test/provider-selector.test.tsx` (new file)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { AIProviderSelector } from '@/app/components/ui/ai-provider-selector';

describe('AI Provider Selector - XAI support', () => {
  it('should render XAI as provider option', () => {
    render(<AIProviderSelector />);

    expect(screen.getByText(/X\.AI/i)).toBeInTheDocument();
    expect(screen.getByText(/Grok/i)).toBeInTheDocument();
  });

  it('should show XAI models when XAI selected', () => {
    render(<AIProviderSelector />);

    // Select XAI provider
    const xaiOption = screen.getByText(/X\.AI/i);
    fireEvent.click(xaiOption);

    // Verify Grok models appear
    expect(screen.getByText(/Grok Beta/i)).toBeInTheDocument();
    expect(screen.getByText(/Grok.*Turbo/i)).toBeInTheDocument();

    // Verify expensive models NOT shown
    expect(screen.queryByText(/Grok-4/i)).not.toBeInTheDocument();
  });
});
```

## Steps to implement

1) Read `apps/x-reason-web/src/app/components/ui/ai-provider-selector.tsx`

2) Add XAI to providers array with appropriate icon

3) Import XAI models from providers.ts

4) Update `getModelsForProvider()` function to include XAI case

5) Update model selection logic for XAI default

6) Create or import XAI icon component

7) Update ARIA labels to include XAI

8) Test component rendering with all three providers

9) Create test file: `apps/x-reason-web/src/app/test/provider-selector.test.tsx`

10) Add unit tests as specified

11) Run tests: `pnpm test`

12) Manual test:
    - `pnpm dev`
    - Navigate to page with provider selector
    - Verify XAI appears in list
    - Select XAI and verify fast models display
    - Test keyboard navigation

## No-regression verification

- Run:
  - `pnpm lint` (should pass)
  - `pnpm test` (all tests including new UI tests should pass)
  - `pnpm build` (should succeed)
- Manual:
  - Test all three providers (OpenAI, Gemini, XAI) in UI
  - Verify model lists update correctly when switching providers
  - Test on mobile viewport (responsive design)
  - Verify keyboard navigation and accessibility
  - Check theme consistency (light/dark mode if applicable)

## Out of scope

- Adding model-specific UI controls (temperature, max tokens, etc.)
- Implementing cost indicators or usage tracking
- Adding model performance metrics
- Creating new provider selector layouts
- Modifying other UI components

## Estimate

M (UI component update with testing and accessibility)

## Links

- `apps/x-reason-web/src/app/components/ui/ai-provider-selector.tsx` - File to modify
- `apps/x-reason-web/src/app/test/` - Test directory
- `apps/x-reason-web/src/app/api/ai/providers.ts` - Provider configuration source

## Dependencies

- Story 010 (Add XAI provider) - completed
- Story 011 (XAI fast models) - completed
- Story 012 (Chat route XAI support) - completed

## Notes for implementer

Follow the existing UI patterns for OpenAI and Gemini. Use shadcn/ui Select or RadioGroup components for consistency. Ensure the XAI icon is recognizable (X logo or "Grok" text badge). Test accessibility thoroughly - keyboard navigation and screen reader support are important.