"use server";

import { geminiChatCompletion, geminiGenerateContent } from "../api/gemini/chat/GeminiRequests";

export async function geminiRequests(messages: {role: 'system' | 'user' | 'assistant', content: string | null}[]) {
    const validMessages = messages
        .filter(msg => msg.content !== null)
        .map(msg => ({ ...msg, content: msg.content! }));
    
    return await geminiChatCompletion(validMessages);
}

export async function geminiSimpleRequest(prompt: string) {
    return await geminiGenerateContent(prompt);
}