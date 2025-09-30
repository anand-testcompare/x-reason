#!/usr/bin/env node

/**
 * Test script to verify Vercel AI SDK integration with OpenAI and Google Gemini
 * Run with: tsx test-ai-sdk.ts
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

async function testOpenAI(): Promise<boolean> {
  console.log('\n🧪 Testing OpenAI with Vercel AI SDK...');
  console.log('API Key present:', !!process.env.OPENAI_API_KEY);

  try {
    const { createOpenAI } = await import('@ai-sdk/openai');
    const { generateText } = await import('ai');

    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const model = openai('gpt-4o-mini');

    const { text } = await generateText({
      model,
      messages: [
        { role: 'user', content: 'Say "Hello from OpenAI!" and nothing else.' }
      ],
    });

    console.log('✅ OpenAI Response:', text);
    return true;
  } catch (error: any) {
    console.error('❌ OpenAI Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

async function testGemini(): Promise<boolean> {
  console.log('\n🧪 Testing Google Gemini with Vercel AI SDK...');
  console.log('API Key present:', !!process.env.GOOGLE_GENERATIVE_AI_API_KEY);

  try {
    const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
    const { generateText } = await import('ai');

    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    const model = google('gemini-2.0-flash-exp');

    const { text } = await generateText({
      model,
      messages: [
        { role: 'user', content: 'Say "Hello from Gemini!" and nothing else.' }
      ],
    });

    console.log('✅ Gemini Response:', text);
    return true;
  } catch (error: any) {
    console.error('❌ Gemini Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

async function testProviders(): Promise<boolean> {
  console.log('\n🧪 Testing providers module...');

  try {
    const { aiGenerateContent } = await import('./src/app/api/ai/providers.js');

    console.log('\nTesting OpenAI via providers module...');
    const openaiResult = await aiGenerateContent('Say "Hello from providers!" and nothing else.', {
      provider: 'openai',
      model: 'gpt-4o-mini'
    });
    console.log('✅ OpenAI (via providers):', openaiResult);

    console.log('\nTesting Gemini via providers module...');
    const geminiResult = await aiGenerateContent('Say "Hello from providers!" and nothing else.', {
      provider: 'gemini',
      model: 'gemini-2.0-flash-exp'
    });
    console.log('✅ Gemini (via providers):', geminiResult);

    return true;
  } catch (error: any) {
    console.error('❌ Providers Module Error:', error.message);
    console.error('   Stack:', error.stack);
    return false;
  }
}

async function main() {
  console.log('🚀 Vercel AI SDK Integration Test\n');
  console.log('Environment:');
  console.log('- OpenAI API Key:', process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 10)}...` : 'NOT SET');
  console.log('- Gemini API Key:', process.env.GOOGLE_GENERATIVE_AI_API_KEY ? `${process.env.GOOGLE_GENERATIVE_AI_API_KEY.substring(0, 10)}...` : 'NOT SET');

  const results = {
    openai: await testOpenAI(),
    gemini: await testGemini(),
    providers: await testProviders(),
  };

  console.log('\n📊 Test Results:');
  console.log('- OpenAI Direct:', results.openai ? '✅ PASS' : '❌ FAIL');
  console.log('- Gemini Direct:', results.gemini ? '✅ PASS' : '❌ FAIL');
  console.log('- Providers Module:', results.providers ? '✅ PASS' : '❌ FAIL');

  const allPassed = Object.values(results).every(r => r === true);
  console.log('\n' + (allPassed ? '✅ All tests passed!' : '❌ Some tests failed'));

  process.exit(allPassed ? 0 : 1);
}

main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});