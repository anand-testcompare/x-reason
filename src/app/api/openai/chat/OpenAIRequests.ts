"use server";

import OpenAI from "openai";
import { put } from "@vercel/blob";

import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions";

// https://www.npmjs.com/package/openai

// todo parameterize this open ai key
let openai: OpenAI;

function lazyOpenAIInit() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
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

export async function chatCompletion(params: ChatCompletionCreateParamsBase, requestId?: string) {
  lazyOpenAIInit();
  
  console.log(`🔧 [OPENAI-INTERNAL] Starting completion with model: ${params.model} (Request ID: ${requestId || 'N/A'})`);
  
  const completion = await openai.chat.completions.create({
    messages: params.messages,
    model: params.model,
    response_format: params.response_format || { type: 'text' },
  });
  
  console.log(`🔧 [OPENAI-INTERNAL] Completion successful, tokens used: ${completion.usage?.total_tokens || 'N/A'} (Request ID: ${requestId || 'N/A'})`);
  
  return completion.choices[0].message.content;
}

export async function* chatCompletionStream(params: ChatCompletionCreateParamsBase, requestId?: string) {
  lazyOpenAIInit();
  
  console.log(`🔧 [OPENAI-INTERNAL] Starting streaming completion with model: ${params.model} (Request ID: ${requestId || 'N/A'})`);
  
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

