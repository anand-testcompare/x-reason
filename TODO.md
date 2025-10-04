# TODO (FOR HUMANS ONLY NOT coding AGENTS)
-- @coding AGENTS execute on your stories in /TODO/*.md ignore this file
-- @requirement AGENTS this is the best place to discuss the details w/ or have the human make decisions


1. i still see some code we aren't utilizing like tables for the ingredient lists. i dont care to remove yet cuz i want to think about how we handle that in the future
2. migrate to OIDC token-based approach for Vercel AI SDK authentication (instead of AI_GATEWAY_API_KEY)

3. linkedin post:
```
**[x-reason.dev](https://www.x-reason.dev/)** — hands-on demo of **X-Reason** (by Codestrap), a framework for deterministic, auditable state machines for LLM workflows.

I’ve had the benefit of deep discussions with Dorian as this was evolving — this demo is so others can reach the same *aha* moment by exploring directly.

**Why care:**

1. Built on **XState + TypeScript** → mature foundations, clear transitions, guards, advanced capabilities
2. Auditable, testable, model-agnostic reasoning
3. High throughput → ~1–3k TPS on OSS-120B (for reference, GPT-5 likely ~50 TPS)
4. On-demand workflow generation → AI-created agent flows with just the right tools + curated context

**Demo agents:**

1. **Reggie** — registration/sales agent (simple). Example: *“I’m a returning visitor, show me special offers for the premium plan.”*
2. **Chemli** — pharma/chemistry R&D agent (complex). Example: *“Design an anti-aging serum with peptides + hyaluronic acid.”*

Code: [github.com/anand-testcompare/x-reason](https://github.com/anand-testcompare/x-reason)
Final home: [foundry-developer-foundations (packages/x-reason)](https://github.com/doriansmiley/foundry-developer-foundations/tree/master/packages/x-reason)

```
