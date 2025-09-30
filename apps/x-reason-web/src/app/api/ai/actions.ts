"use server";

import { aiChatCompletion as providerChatCompletion, aiGenerateContent as providerGenerateContent } from "./providers";
import { AIMessage, AIConfig } from "./providers";

export async function aiChatCompletion(
  messages: AIMessage[],
  config: AIConfig = { provider: 'gemini' }
): Promise<string | null> {
  return providerChatCompletion(messages, config);
}

export async function aiGenerateContent(
  prompt: string,
  config: AIConfig = { provider: 'gemini' }
): Promise<string | null> {
  return providerGenerateContent(prompt, config);
}