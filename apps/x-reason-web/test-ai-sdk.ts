#!/usr/bin/env node

/**
 * Gateway-only smoke test for Vercel AI SDK integration.
 * Run with: tsx test-ai-sdk.ts
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { generateText } from 'ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

delete process.env.AI_GATEWAY_API_KEY;

const smokeTests = [
  {
    name: 'OpenAI fast default',
    model: 'openai/gpt-5.4-nano',
    prompt: 'Say "Hello from OpenAI Gateway!" and nothing else.',
  },
  {
    name: 'Gemini fast default',
    model: 'google/gemini-3.1-flash-lite',
    prompt: 'Say "Hello from Gemini Gateway!" and nothing else.',
  },
] as const;

async function runSmokeTest(test: (typeof smokeTests)[number]): Promise<boolean> {
  console.log(`\nTesting ${test.name} (${test.model})...`);

  try {
    const { text } = await generateText({
      model: test.model,
      messages: [{ role: 'user', content: test.prompt }],
    });

    console.log('Response:', text);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error:', message);
    return false;
  }
}

async function main() {
  const hasGatewayAuth = !!process.env.VERCEL_OIDC_TOKEN;

  console.log('Vercel AI Gateway smoke test');
  console.log('Gateway auth present:', hasGatewayAuth);

  if (!hasGatewayAuth) {
    console.error('Set VERCEL_OIDC_TOKEN before running this script.');
    process.exit(1);
  }

  const results = await Promise.all(smokeTests.map(runSmokeTest));
  process.exit(results.every(Boolean) ? 0 : 1);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

export {};
