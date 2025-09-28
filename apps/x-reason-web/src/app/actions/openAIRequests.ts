"use server"

import OpenAI from "openai";

export async function openAiRequests(messages: {role: 'system' | 'user' | 'assistant', content: string | null}[]) {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
        messages: messages.filter(msg => msg.content !== null) as any,
        model: "o4-mini", // Updated to mini model
    });

    return completion.choices[0].message.content;

}