#!/usr/bin/env node

/**
 * Test the chat API endpoint with running dev server
 * Start dev server first: pnpm dev
 * Then run: tsx test-chat-api.ts
 */

async function testChatAPI(provider: string, model: string, message: string): Promise<boolean> {
  console.log(`\n🧪 Testing /api/ai/chat with ${provider} (${model})...`);

  try {
    const response = await fetch('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: message }],
        provider,
        model,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    // Read the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      fullResponse += chunk;
    }

    console.log(`✅ ${provider} Response:`, fullResponse.substring(0, 100) + (fullResponse.length > 100 ? '...' : ''));
    return true;
  } catch (error: any) {
    console.error(`❌ ${provider} Error:`, error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Chat API Integration Test');
  console.log('📝 Make sure dev server is running: pnpm dev\n');

  // Test if server is running
  try {
    await fetch('http://localhost:3000');
  } catch (error) {
    console.error('❌ Dev server not running on http://localhost:3000');
    console.error('   Start it with: pnpm dev');
    process.exit(1);
  }

  const results = {
    openai: await testChatAPI('openai', 'gpt-4o-mini', 'Say "Hello from OpenAI API!" and nothing else.'),
    gemini: await testChatAPI('gemini', 'gemini-2.0-flash-exp', 'Say "Hello from Gemini API!" and nothing else.'),
  };

  console.log('\n📊 Test Results:');
  console.log('- OpenAI API:', results.openai ? '✅ PASS' : '❌ FAIL');
  console.log('- Gemini API:', results.gemini ? '✅ PASS' : '❌ FAIL');

  const allPassed = Object.values(results).every(r => r === true);
  console.log('\n' + (allPassed ? '✅ All API tests passed!' : '❌ Some API tests failed'));

  process.exit(allPassed ? 0 : 1);
}

runTests().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});