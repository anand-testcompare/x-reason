"use server";

import OpenAI from "openai";
import { put } from "@vercel/blob";

import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions";

// https://www.npmjs.com/package/openai

// todo parameterize this open ai key
let openai: OpenAI;

function lazyOpenAIInit(apiKey?: string) {
  const keyToUse = apiKey || process.env.OPENAI_API_KEY;
  if (!keyToUse) {
    throw new Error('OpenAI API key is required but not provided');
  }
  
  // Create a new instance if we don't have one or if using a different API key
  if (!openai || (apiKey && apiKey !== process.env.OPENAI_API_KEY)) {
    openai = new OpenAI({
      apiKey: keyToUse,
    });
  }
}

async function storeImageBlob(key: string, blob: any) {
  const namespace = "image";
  const response = await put(`${namespace}:${key}.png`, blob, {
    access: "public",
    contentType: "image/png",
  });
  console.log("storeImageBlob.ts: Blob stored at: " + response.url);
  return response.url;
}

export async function chatCompletion(params: ChatCompletionCreateParamsBase, requestId?: string, apiKey?: string) {
  lazyOpenAIInit(apiKey);
  
  console.log(`🔧 [OPENAI-INTERNAL] Starting completion with model: ${params.model} (Request ID: ${requestId || 'N/A'})`);
  
  try {
    const completion = await openai.chat.completions.create({
      messages: params.messages,
      model: params.model,
      response_format: params.response_format || { type: 'text' },
    });
    
    console.log(`🔧 [OPENAI-INTERNAL] Completion successful, tokens used: ${completion.usage?.total_tokens || 'N/A'} (Request ID: ${requestId || 'N/A'})`);
    
    return completion.choices[0].message.content;
  } catch (error: any) {
    // Log detailed request information for policy violations and other errors
    console.error(`🚨 [OPENAI-ERROR] Request failed with error:`, error);
    console.error(`🚨 [OPENAI-ERROR] Request details that caused the error:`);
    console.error(`   Model: ${params.model}`);
    console.error(`   Request ID: ${requestId || 'N/A'}`);
    console.error(`   Messages (${params.messages.length} total):`);
    
    params.messages.forEach((msg, index) => {
      console.error(`   Message ${index + 1} (${msg.role}):`);
      if (typeof msg.content === 'string') {
        // Truncate very long messages but show enough to understand the issue
        const content = msg.content.length > 1000 ? 
          msg.content.substring(0, 1000) + '... [TRUNCATED]' : 
          msg.content;
        console.error(`     Content: ${content}`);
      } else {
        console.error(`     Content: [Complex content object]`, msg.content);
      }
    });
    
    if (error.code === 'invalid_prompt') {
      console.error(`🚨 [OPENAI-POLICY-VIOLATION] This request was flagged by OpenAI's usage policy.`);
      console.error(`🚨 [OPENAI-POLICY-VIOLATION] Review the messages above to identify potentially problematic content.`);
      console.error(`🚨 [OPENAI-POLICY-VIOLATION] Error details:`, {
        code: error.code,
        message: error.message,
        type: error.type
      });
    }
    
    throw error;
  }
}

export async function* chatCompletionStream(params: ChatCompletionCreateParamsBase, requestId?: string, apiKey?: string) {
  lazyOpenAIInit(apiKey);
  
  console.log(`🔧 [OPENAI-INTERNAL] Starting streaming completion with model: ${params.model} (Request ID: ${requestId || 'N/A'})`);
  
  try {
    const stream = await openai.chat.completions.create({
      messages: params.messages,
      model: params.model,
      response_format: params.response_format || { type: 'text' },
      stream: true,
    });
    
    let totalTokens = 0;
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
      totalTokens += 1; // Approximate token counting
    }
    
    console.log(`🔧 [OPENAI-INTERNAL] Streaming completion finished, approximate tokens: ${totalTokens} (Request ID: ${requestId || 'N/A'})`);
  } catch (error: any) {
    // Log detailed request information for policy violations and other errors
    console.error(`🚨 [OPENAI-STREAM-ERROR] Streaming request failed with error:`, error);
    console.error(`🚨 [OPENAI-STREAM-ERROR] Request details that caused the error:`);
    console.error(`   Model: ${params.model}`);
    console.error(`   Request ID: ${requestId || 'N/A'}`);
    console.error(`   Messages (${params.messages.length} total):`);
    
    params.messages.forEach((msg, index) => {
      console.error(`   Message ${index + 1} (${msg.role}):`);
      if (typeof msg.content === 'string') {
        // Truncate very long messages but show enough to understand the issue
        const content = msg.content.length > 1000 ? 
          msg.content.substring(0, 1000) + '... [TRUNCATED]' : 
          msg.content;
        console.error(`     Content: ${content}`);
      } else {
        console.error(`     Content: [Complex content object]`, msg.content);
      }
    });
    
    if (error.code === 'invalid_prompt') {
      console.error(`🚨 [OPENAI-POLICY-VIOLATION] This streaming request was flagged by OpenAI's usage policy.`);
      console.error(`🚨 [OPENAI-POLICY-VIOLATION] Review the messages above to identify potentially problematic content.`);
      console.error(`🚨 [OPENAI-POLICY-VIOLATION] Error details:`, {
        code: error.code,
        message: error.message,
        type: error.type
      });
    }
    
    throw error;
  }
}

export async function generateEmbeddings(textArray: string[]) {
  lazyOpenAIInit();
  // Replace newlines with spaces in each text input
  const inputs = textArray.map((text) => text.replace(/\n/g, " "));
  const embeddingData = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: inputs,
  });
  // Extract embeddings from the response
  return embeddingData.data.map((item) => item.embedding);
}

export async function generateEmbedding(raw: string) {
  lazyOpenAIInit();
  const input = raw.replace(/\n/g, " "); // OpenAI recommends replacing newlines with spaces
  const embeddingData = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input,
  });
  const [{ embedding }] = embeddingData.data;
  return embedding;
}

export async function getImage(prompt: string, recursionBackOff?: number) {
  try {
    lazyOpenAIInit();
    const response = await openai.images.generate({
      prompt,
      n: 1,
      size: "512x512",
    });
    console.log(`OpenAIRequests.ts: Requested image from dalle for ${prompt}, got ${response.data?.[0]?.url}`);
    const dalleBlobUrl = response.data?.[0]?.url;

    if (dalleBlobUrl) {
      const response = await fetch(dalleBlobUrl);
      const blob = await response.blob();
      const imageUrl = await storeImageBlob(prompt, blob);
      return imageUrl;
    }
  } catch (error) {
    console.log(`Error: OpenAiRequests.getImage: Error with prompt ${prompt}`, error);
  }
  if (recursionBackOff === undefined) {
    recursionBackOff = 3;
  }
  if (recursionBackOff > 0) {
    return getImage("Cartoon drawing of a painter drawing an image. The Painter is drawing is 'Image in construction'", recursionBackOff - 1);
  }
}

