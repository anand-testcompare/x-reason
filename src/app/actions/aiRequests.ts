"use server";

import { aiChatCompletion, aiGenerateContent } from "../api/ai/actions";
import { AIMessage, AIConfig } from "../api/ai/providers";
import { AILogger } from "../utils/aiLogger";

export async function aiRequests(
    messages: {role: 'system' | 'user' | 'assistant', content: string | null}[],
    config: AIConfig = { provider: 'gemini' }
) {
    const requestId = AILogger.generateRequestId();
    console.log(`⚡ [ACTION] aiRequests called with provider: ${config.provider}, ${messages.length} messages (Request ID: ${requestId})`);
    
    const validMessages: AIMessage[] = messages
        .filter(msg => msg.content !== null)
        .map(msg => ({ ...msg, content: msg.content! }));
    
    console.log(`⚡ [ACTION] Filtered to ${validMessages.length} valid messages (Request ID: ${requestId})`);
    
    return await aiChatCompletion(validMessages, config);
}

export async function aiSimpleRequest(prompt: string, config: AIConfig = { provider: 'gemini' }) {
    const requestId = AILogger.generateRequestId();
    console.log(`⚡ [ACTION] aiSimpleRequest called with provider: ${config.provider}, prompt length: ${prompt.length} (Request ID: ${requestId})`);
    
    return await aiGenerateContent(prompt, config);
}