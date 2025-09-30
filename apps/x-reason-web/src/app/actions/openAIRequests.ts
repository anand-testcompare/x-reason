"use server"

import { aiChatCompletion, AIMessage } from "../api/ai/providers";

export async function openAiRequests(messages: {role: 'system' | 'user' | 'assistant', content: string | null}[]) {
    // Convert to AIMessage format and filter out null content
    const aiMessages: AIMessage[] = messages
        .filter(msg => msg.content !== null)
        .map(msg => ({
            role: msg.role,
            content: msg.content as string
        }));

    const result = await aiChatCompletion(aiMessages, {
        provider: 'openai',
        model: 'o4-mini'
    });

    return result;
}