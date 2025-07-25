export function extractJsonFromBackticks(text: string): string | null {
    if (!text) return null;

    // Strategy 1: Try to extract JSON from markdown code blocks (original behavior)
    const backticksRegex = /```\s*(?:json\s*)?([^`]+)```/i;
    const backticksMatch = text.match(backticksRegex);
    if (backticksMatch) {
        const extracted = backticksMatch[1].trim();
        if (isValidJson(extracted)) {
            return extracted;
        }
    }

    // Strategy 2: Try to find JSON by looking for array or object patterns
    // Look for JSON arrays starting with [ and ending with ]
    const arrayRegex = /(\[[\s\S]*?\])/;
    const arrayMatch = text.match(arrayRegex);
    if (arrayMatch) {
        const candidate = arrayMatch[1].trim();
        if (isValidJson(candidate)) {
            return candidate;
        }
    }

    // Strategy 3: Look for JSON objects starting with { and ending with }
    const objectRegex = /(\{[\s\S]*?\})/;
    const objectMatch = text.match(objectRegex);
    if (objectMatch) {
        const candidate = objectMatch[1].trim();
        if (isValidJson(candidate)) {
            return candidate;
        }
    }

    // Strategy 4: Try to clean up the text and parse it directly
    const cleanedText = text.trim();
    if (isValidJson(cleanedText)) {
        return cleanedText;
    }

    return null;
}

function isValidJson(str: string): boolean {
    try {
        JSON.parse(str);
        return true;
    } catch {
        return false;
    }
}