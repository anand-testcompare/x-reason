import { NextRequest, NextResponse } from "next/server";
import { geminiChatCompletion } from "./GeminiRequests";

export async function POST(request: NextRequest) {
  try {
    const { messages, model } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }
    
    const response = await geminiChatCompletion(messages, undefined, model);
    
    return NextResponse.json({ 
      content: response,
      model: model || "gemini-2.0-flash" // Show the actual model used (with fallback to default)
    });
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}