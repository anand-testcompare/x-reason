import { NextRequest, NextResponse } from "next/server";
import { geminiChatCompletion } from "./GeminiRequests";

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }
    
    const response = await geminiChatCompletion(messages);
    
    return NextResponse.json({ 
      content: response,
      model: "gemini-2.0-flash"
    });
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}