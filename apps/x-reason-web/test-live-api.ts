#!/usr/bin/env node

/**
 * Test the live API endpoints
 */

const PORT = process.argv[2] || 3001;

async function testChatAPI(provider: string, model: string, message: string): Promise<boolean> {
  console.log(`\n🧪 Testing /api/ai/chat with ${provider} (${model})...`);

  try {
    const response = await fetch(`http://localhost:${PORT}/api/ai/chat`, {
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

    console.log(`   Response Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);

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
    let chunkCount = 0;

    console.log('   📡 Reading stream...');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      fullResponse += chunk;
      chunkCount++;

      // Show first few chunks
      if (chunkCount <= 3) {
        console.log(`   Chunk ${chunkCount}: ${chunk.substring(0, 50)}${chunk.length > 50 ? '...' : ''}`);
      }
    }

    console.log(`   Total chunks: ${chunkCount}`);
    console.log(`   Total length: ${fullResponse.length} chars`);

    // Try to extract text from data stream
    const lines = fullResponse.split('\n').filter(line => line.startsWith('0:"'));
    if (lines.length > 0) {
      const text = lines.join('').replace(/0:"/g, '').replace(/"/g, '');
      console.log(`✅ ${provider} Response: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
    } else {
      console.log(`✅ ${provider} Streaming worked (${fullResponse.length} bytes received)`);
    }

    return true;
  } catch (error: any) {
    console.error(`❌ ${provider} Error:`, error.message);
    if (error.stack) {
      console.error('   Stack:', error.stack.split('\n').slice(0, 3).join('\n'));
    }
    return false;
  }
}

async function runLiveTests() {
  console.log('🚀 Live API Integration Test');
  console.log(`📍 Testing server at http://localhost:${PORT}\n`);

  // Test if server is running
  try {
    const response = await fetch(`http://localhost:${PORT}`);
    console.log(`✅ Server is running (Status: ${response.status})\n`);
  } catch (error: any) {
    console.error(`❌ Server not responding on http://localhost:${PORT}`);
    console.error('   Error:', error.message);
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

runLiveTests().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});