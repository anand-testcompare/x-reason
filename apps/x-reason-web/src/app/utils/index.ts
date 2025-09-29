export * from './storeFactory';
export * from './aiLogger';
export { default as factory } from './factory';
export { extractJsonFromBackticks } from '@codestrap/developer-foundations-utils';

/**
 * Safely extracts content from AI provider responses.
 * Handles both direct text and JSON responses with fallback to original content.
 * 
 * @param rawContent - The raw response content (could be text or JSON)
 * @returns The extracted text content
 */
export function safeExtractContent(rawContent: string): string {
  // If it's already clean text (no JSON), return as is
  if (!rawContent.includes('{') || !rawContent.includes('}')) {
    return rawContent;
  }

  try {
    // Try to parse as JSON
    const parsed = JSON.parse(rawContent);
    
    // Handle different response structures
    if (typeof parsed === 'object' && parsed !== null) {
      // Check for common AI response formats
      if (parsed.content && typeof parsed.content === 'string') {
        return parsed.content;
      }
      
      // Check for OpenAI format
      if (parsed.choices && Array.isArray(parsed.choices) && parsed.choices[0]?.message?.content) {
        return parsed.choices[0].message.content;
      }
      
      // Check for Gemini format  
      if (parsed.candidates && Array.isArray(parsed.candidates) && parsed.candidates[0]?.content?.parts?.[0]?.text) {
        return parsed.candidates[0].content.parts[0].text;
      }
      
      // If it's an object but no recognized format, try to extract any text field
      const textFields = ['text', 'message', 'response', 'result', 'output'];
      for (const field of textFields) {
        if (parsed[field] && typeof parsed[field] === 'string') {
          return parsed[field];
        }
      }
    }
    
    // If parsed but no recognizable content field, return original
    return rawContent;
  } catch (error) {
    // JSON parsing failed, return original content
    return rawContent;
  }
}