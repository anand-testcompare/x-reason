"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

// Default Gemini model
const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";

let genAI: GoogleGenerativeAI;

function lazyGeminiInit(apiKey?: string) {
  const keyToUse = apiKey || process.env.GEMINI_API_KEY;
  if (!keyToUse) {
    throw new Error('Gemini API key is required but not provided');
  }
  
  // Create a new instance if we don't have one or if using a different API key
  if (!genAI || (apiKey && apiKey !== process.env.GEMINI_API_KEY)) {
    genAI = new GoogleGenerativeAI(keyToUse);
  }
}

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export async function geminiChatCompletion(
  messages: { role: 'system' | 'user' | 'assistant', content: string }[],
  requestId?: string,
  modelName: string = DEFAULT_GEMINI_MODEL,
  apiKey?: string
) {
  lazyGeminiInit(apiKey);
  
  console.log(`🔧 [GEMINI-INTERNAL] Starting completion with model: ${modelName} (Request ID: ${requestId || 'N/A'})`);
  
  const model = genAI.getGenerativeModel({ model: modelName });
  
  // Convert OpenAI-style messages to Gemini format
  const geminiMessages: GeminiMessage[] = [];
  let systemInstruction = "";
  
  for (const message of messages) {
    if (message.role === 'system') {
      systemInstruction = message.content;
    } else if (message.role === 'user') {
      // Prepend system instruction to the first user message if present
      const content = systemInstruction && geminiMessages.length === 0 
        ? `System: ${systemInstruction}\n\nUser: ${message.content}`
        : message.content;
      
      geminiMessages.push({
        role: 'user',
        parts: [{ text: content }]
      });
      systemInstruction = ""; // Clear it after first use
    } else if (message.role === 'assistant') {
      geminiMessages.push({
        role: 'model',
        parts: [{ text: message.content }]
      });
    }
  }
  
  console.log(`🔧 [GEMINI-INTERNAL] Converted ${messages.length} messages to Gemini format (Request ID: ${requestId || 'N/A'})`);
  
  // Create chat without systemInstruction to avoid API issues
  const chat = model.startChat({
    history: geminiMessages.slice(0, -1), // All but the last message
  });
  
  // Send the last message
  const lastMessage = geminiMessages[geminiMessages.length - 1];
  const result = await chat.sendMessage(lastMessage.parts[0].text);
  const response = await result.response;
  
  console.log(`🔧 [GEMINI-INTERNAL] Completion successful (Request ID: ${requestId || 'N/A'})`);
  
  return response.text();
}

export async function geminiGenerateContent(prompt: string, modelName: string = DEFAULT_GEMINI_MODEL) {
  lazyGeminiInit();
  
  const model = genAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  
  return response.text();
}

export async function geminiGenerateEmbedding(text: string) {
  lazyGeminiInit();
  
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  
  return result.embedding.values;
}