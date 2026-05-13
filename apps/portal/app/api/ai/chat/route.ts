import { NextRequest, NextResponse } from "next/server";
import { generateAIResponse, AIRequest } from "@/lib/ai/ai-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, context, temperature, maxTokens } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request: messages array required" },
        { status: 400 }
      );
    }

    const aiRequest: AIRequest = {
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      context,
      temperature,
      maxTokens,
    };

    const response = await generateAIResponse(aiRequest);

    return NextResponse.json(response);
  } catch (error) {
    console.error("AI chat API error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI response" },
      { status: 500 }
    );
  }
}
