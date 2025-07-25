import { interpret } from "xstate";
import { aiChatCompletion, AIConfig } from "@/app/api/ai/providers";

import {
    StateConfig,
    EvaluationInput,
    EvaluatorResult,
    ReasoningEngine,
    programV1,
    Prompt,
} from ".";

import { extractJsonFromBackticks } from "@/app/utils";

async function solve(query: string, solver: Prompt, config: AIConfig = { provider: 'gemini' }): Promise<string> {
    const { user, system } = await solver(query);

    const result = await aiChatCompletion([
        { role: 'system', content: system },
        { role: 'user', content: user },
    ], config);
    
    return result || '';
}

async function program(query: string, functionCatalog: string, programmer: Prompt, config: AIConfig = { provider: 'gemini' }): Promise<StateConfig[]> {
    const { user, system } = await programmer(query, functionCatalog);

    const result = await aiChatCompletion([
        { role: 'system', content: system },
        { role: 'user', content: user },
    ], config);

    if (!result) {
        throw new Error('No result from AI provider');
    }

    // Log the AI response for debugging
    console.log('AI Response:', result);

    // Extract JSON from the response
    const jsonString = extractJsonFromBackticks(result);
    if (!jsonString) {
        throw new Error('No JSON found in response');
    }

    try {
        const parsed = JSON.parse(jsonString);
        console.log('Parsed JSON:', parsed);
        
        // Ensure the parsed result is an array
        if (Array.isArray(parsed)) {
            return parsed as StateConfig[];
        } else {
            throw new Error('Parsed result is not an array');
        }
    } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Raw response:', result);
        console.error('Extracted JSON string:', jsonString);
        throw new Error(`Failed to parse AI response as JSON: ${parseError}`);
    }
}

async function evaluate(input: EvaluationInput, evaluator: Prompt, config: AIConfig = { provider: 'gemini' }): Promise<EvaluatorResult> {
    const { user, system } = await evaluator(input.query, input.states, input.tools);

    const result = await aiChatCompletion([
        { role: 'system', content: system },
        { role: 'user', content: user },
    ], config);
    
    // For now, just return a basic evaluation
    return { rating: 1 };
}

export function createReasoningEngineV2(config: AIConfig = { provider: 'gemini' }): ReasoningEngine {
    return {
        solver: { 
            solve: (query: string, solver: Prompt) => solve(query, solver, config)
        },
        programmer: { 
            program: (query: string, functionCatalog: string, programmer: Prompt) => 
                program(query, functionCatalog, programmer, config)
        },
        evaluator: { 
            evaluate: async () => ({ rating: 1 }) // Placeholder implementation
        },
        logic: { 
            transition: async () => "continue" // Placeholder implementation
        }
    };
}